"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconArrowLeft,
  IconExternalLink,
  IconPencil,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCan } from "@/hooks/use-can";
import { isValidUrl, normalizeUrl } from "@/lib/url";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  DeleteKnowledgeItem,
  FetchKnowledgeItem,
  PublishKnowledgeItems,
  UpdateKnowledgeItem,
  UpdateKnowledgeItemsScope,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";

import { formatBytes } from "@/components/custom/knowledge/file-upload-dropzone";
import {
  fileExtension,
  KnowledgeItemIcon,
  KnowledgeStatusBadge,
} from "@/components/custom/knowledge/knowledge-badges";
import { timeAgo } from "@/components/custom/knowledge/knowledge-list";
import {
  FAQ_ANSWER_MAX_LENGTH,
  isKnowledgeItemEditable,
  KNOWLEDGE_SOURCE_LABEL,
} from "@/components/custom/knowledge/knowledge-meta";
import { KnowledgeScopePanel } from "@/components/custom/knowledge/knowledge-scope-panel";
import {
  scopeOfItem,
  validateScope,
  type KnowledgeScope,
} from "@/components/custom/knowledge/knowledge-scope";
import { cn } from "@/lib/utils";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** `shipping_policy` as "Shipping policy". */
const humanize = (value: string) => {
  const text = value.replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const sameScope = (a: string[], b: string[]) =>
  a.length === b.length && a.every((entry) => b.includes(entry));

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 p-3 sm:p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}

/** A link to the page or document itself, so it can be opened and read directly. */
function SourceLink({
  label,
  href,
  text,
  action,
}: {
  label: string;
  href: string;
  text: string;
  action: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{label}</h2>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 basis-60 truncate text-sm font-medium text-primary underline-offset-2 hover:underline"
          title={text}
        >
          {text}
        </a>
        <Button asChild variant="outline" size="sm">
          <a href={href} target="_blank" rel="noreferrer">
            <IconExternalLink className="size-4" />
            {action}
          </a>
        </Button>
      </div>
    </section>
  );
}

/**
 * Looks at one knowledge item that isn't an article: a document, a website
 * page or a question and answer. Nothing can be changed until Edit is pressed;
 * then the question and answer (or the page address) and who uses it can be,
 * and are saved together. Articles open in their editor instead.
 */
export function KnowledgeItemPage({ itemId }: { itemId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const wantsEdit = useSearchParams()?.get("edit") === "1";
  const canEdit = useCan("knowledge", { write: true });
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [reloads, setReloads] = useState(0);

  // What is being edited, while editing; `null` otherwise.
  const [editing, setEditing] = useState(false);
  const [scope, setScope] = useState<KnowledgeScope | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [url, setUrl] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [publishOpen, setPublishOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!storeCode) return;
    let cancelled = false;

    void dispatch(FetchKnowledgeItem({ id: itemId, storeCode })).then(
      (result) => {
        if (cancelled) return;
        if (!FetchKnowledgeItem.fulfilled.match(result)) {
          setLoadState("missing");
          return;
        }
        const loaded = result.payload;
        // Articles have their own editor.
        if (loaded.source === "article") {
          router.replace(`/knowledge/articles/${loaded.id}`);
          return;
        }
        setItem(loaded);
        setScope(scopeOfItem(loaded));
        setQuestion(loaded.question ?? "");
        setAnswer(loaded.answer ?? "");
        setUrl(loaded.url ?? "");
        // The list's Edit action opens this page already editing; only the
        // first time, so saving (which reloads) doesn't reopen the form.
        if (wantsEdit && reloads === 0 && canEdit) {
          setEditing(isKnowledgeItemEditable(loaded.status));
        }
        setLoadState("ready");
      },
    );

    return () => {
      cancelled = true;
    };
  }, [dispatch, router, itemId, storeCode, reloads, wantsEdit, canEdit]);

  const canEditItem =
    canEdit && item !== null && isKnowledgeItemEditable(item.status);

  const reload = () => setReloads((count) => count + 1);

  const cancelEdit = () => {
    if (!item) return;
    setScope(scopeOfItem(item));
    setQuestion(item.question ?? "");
    setAnswer(item.answer ?? "");
    setUrl(item.url ?? "");
    setShowErrors(false);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!item || !scope || !storeCode) return;

    setShowErrors(true);
    const faqInvalid =
      item.source === "faq" && (!question.trim() || !answer.trim());
    const urlInvalid =
      item.source === "url" && (!url.trim() || !isValidUrl(url));
    if (validateScope(scope).aiScope || faqInvalid || urlInvalid) return;

    const scopeChanged = !sameScope(scope.aiScope, item.aiScope);
    const contentChanged =
      (item.source === "faq" &&
        (question.trim() !== item.question || answer.trim() !== item.answer)) ||
      (item.source === "url" && normalizeUrl(url) !== item.url);
    if (!scopeChanged && !contentChanged) {
      setEditing(false);
      return;
    }

    setIsSaving(true);
    // Who uses it goes first, on its own: it needs no processing and reaches the
    // stored vectors straight away. Changing the text or address afterwards
    // sends the item through processing again, which keeps that scope.
    if (scopeChanged) {
      const result = await dispatch(
        UpdateKnowledgeItemsScope({
          ids: [item.id],
          aiScope: scope.aiScope,
          storeCode,
          silent: !contentChanged,
        }),
      );
      if (!UpdateKnowledgeItemsScope.fulfilled.match(result)) {
        setIsSaving(false);
        return;
      }
    }
    if (contentChanged) {
      const result = await dispatch(
        UpdateKnowledgeItem({
          id: item.id,
          storeCode,
          patch: {
            type: item.type,
            source: item.source,
            aiScope: scope.aiScope,
            ...(item.source === "faq"
              ? { question: question.trim(), answer: answer.trim() }
              : { url: normalizeUrl(url) }),
          },
        }),
      );
      if (!UpdateKnowledgeItem.fulfilled.match(result)) {
        setIsSaving(false);
        reload();
        return;
      }
    }

    setIsSaving(false);
    setShowErrors(false);
    setEditing(false);
    reload();
  };

  const handlePublish = async () => {
    if (!storeCode) return;
    setIsPublishing(true);
    await dispatch(PublishKnowledgeItems({ ids: [itemId], storeCode }));
    setIsPublishing(false);
    setPublishOpen(false);
    reload();
  };

  const handleDelete = async () => {
    if (!storeCode) return;
    setIsDeleting(true);
    const result = await dispatch(
      DeleteKnowledgeItem({ id: itemId, storeCode }),
    );
    if (DeleteKnowledgeItem.fulfilled.match(result)) {
      router.push("/knowledge");
      return;
    }
    setIsDeleting(false);
    setDeleteOpen(false);
  };

  if (loadState === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Loading…
      </div>
    );
  }

  if (loadState === "missing" || !item || !scope) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <p className="font-semibold">We couldn&apos;t find this knowledge</p>
        <p className="text-sm text-muted-foreground">
          It may have been deleted, or it belongs to another store.
        </p>
        <Button asChild variant="outline">
          <Link href="/knowledge">Back to Knowledge</Link>
        </Button>
      </div>
    );
  }

  const isInProgress = item.status === "processing";
  const extension = (fileExtension(item) ?? "").toUpperCase();
  const scopeErrors = showErrors ? validateScope(scope) : {};

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/knowledge">
            <IconArrowLeft className="size-4" />
            Knowledge
          </Link>
        </Button>

        <div className="flex min-w-0 flex-1 basis-48 items-center gap-2.5">
          <KnowledgeItemIcon item={item} />
          <span className="truncate text-sm font-medium" title={item.title}>
            {item.title}
          </span>
          <KnowledgeStatusBadge status={item.status} />
          <span className="shrink-0 text-xs text-muted-foreground max-sm:hidden">
            Updated {timeAgo(item.updatedAt)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={cancelEdit}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving}
                onClick={() => void handleSave()}
              >
                {isSaving && <Spinner data-icon="inline-start" />}
                Save changes
              </Button>
            </>
          ) : (
            <>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canEditItem}
                  title={
                    canEditItem
                      ? undefined
                      : "Only draft or published items can be edited"
                  }
                  onClick={() => setEditing(true)}
                >
                  <IconPencil className="size-4" />
                  <span className="max-sm:hidden">Edit</span>
                </Button>
              )}
              {canEdit && item.status === "draft" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPublishOpen(true)}
                >
                  <IconSend className="size-4" />
                  Publish
                </Button>
              )}
            </>
          )}
          {canEdit && !editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={isInProgress}
              title={
                isInProgress
                  ? "Item is in progress and cannot be deleted"
                  : undefined
              }
              onClick={() => setDeleteOpen(true)}
            >
              <IconTrash className="size-4" />
              <span className="max-sm:hidden">Delete</span>
            </Button>
          )}
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
          <dl
            className={cn(
              "grid divide-x divide-y rounded-xl border bg-card",
              item.source === "faq"
                ? "grid-cols-2 lg:grid-cols-4 lg:divide-y-0"
                : "grid-cols-2 lg:grid-cols-3 lg:divide-y-0",
            )}
          >
            {item.source === "faq" && (
              <Stat
                label="Length"
                value={`${wordCount(`${item.question} ${item.answer}`).toLocaleString()} words`}
              />
            )}
            {item.source === "file" ? (
              <Stat
                label="File"
                value={[
                  extension,
                  item.fileSize ? formatBytes(item.fileSize) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ) : (
              <Stat
                label="Type"
                value={
                  item.source === "faq" ? "Question & answer" : "Website page"
                }
              />
            )}
            <Stat label="Added" value={formatDate(item.createdAt)} />
            <Stat label="Last updated" value={formatDate(item.updatedAt)} />
          </dl>

          {item.status === "failed" && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              This couldn&apos;t be processed, so the assistant isn&apos;t using
              it yet.
            </p>
          )}

          {item.source === "faq" && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">Question and answer</h2>
              {editing ? (
                <div className="flex flex-col gap-4 rounded-xl border p-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="faq-question"
                      className="text-xs font-medium"
                    >
                      Customer asks
                    </label>
                    <Input
                      id="faq-question"
                      value={question}
                      maxLength={500}
                      autoComplete="off"
                      onChange={(event) => setQuestion(event.target.value)}
                      aria-invalid={showErrors && !question.trim()}
                    />
                    {showErrors && !question.trim() && (
                      <p className="text-xs text-destructive">
                        Question is required
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="faq-answer" className="text-xs font-medium">
                      Your answer
                    </label>
                    <Textarea
                      id="faq-answer"
                      className="max-h-96 min-h-28 resize-y"
                      value={answer}
                      maxLength={FAQ_ANSWER_MAX_LENGTH}
                      onChange={(event) => setAnswer(event.target.value)}
                      aria-invalid={showErrors && !answer.trim()}
                    />
                    <div className="flex items-center justify-between gap-2">
                      {showErrors && !answer.trim() ? (
                        <p className="text-xs text-destructive">
                          Answer is required
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {answer.length.toLocaleString()} /{" "}
                        {FAQ_ANSWER_MAX_LENGTH.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Question</p>
                    <p className="mt-1 font-medium whitespace-pre-wrap">
                      {item.question}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Answer</p>
                    <p className="mt-1 whitespace-pre-wrap">{item.answer}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {item.source === "url" &&
            (editing ? (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">Page address</h2>
                <Input
                  value={url}
                  autoComplete="off"
                  aria-label="Page address"
                  onChange={(event) => setUrl(event.target.value)}
                  aria-invalid={showErrors && !isValidUrl(url)}
                />
                {showErrors && !isValidUrl(url) ? (
                  <p className="text-xs text-destructive">
                    Enter a valid page address
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Changing it reads the page again.
                  </p>
                )}
              </section>
            ) : (
              item.url && (
                <SourceLink
                  label="Page"
                  href={item.url}
                  text={item.url}
                  action="Open page"
                />
              )
            ))}

          {item.source === "file" && item.fileUrl && (
            <SourceLink
              label="Document"
              href={item.fileUrl}
              text={item.fileName || item.title}
              action="View document"
            />
          )}
        </main>

        <aside className="flex flex-col gap-5 border-t p-4 lg:border-t-0 lg:border-l">
          <KnowledgeScopePanel
            value={scope}
            onChange={setScope}
            bordered={false}
            // Where it applies is fixed once added; who uses it can be edited.
            appliesToLocked
            usedByLocked={!editing}
            showErrors={Boolean(scopeErrors.aiScope)}
            description={
              editing
                ? "Choose which AI use it, then save."
                : "Press Edit to change who uses it."
            }
          />

          <hr />

          <section className="flex flex-col gap-2 text-xs">
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted-foreground">Source</dt>
              <dd>{KNOWLEDGE_SOURCE_LABEL[item.source]}</dd>
              {item.category && (
                <>
                  <dt className="text-muted-foreground">KB type</dt>
                  <dd>{humanize(item.category)}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <KnowledgeStatusBadge status={item.status} />
              </dd>
              {item.createdBy && (
                <>
                  <dt className="text-muted-foreground">Added by</dt>
                  <dd>{item.createdBy}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Added</dt>
              <dd>{formatDate(item.createdAt)}</dd>
              <dt className="text-muted-foreground">Last updated</dt>
              <dd>
                {formatDate(item.updatedAt)}
                {item.updatedBy ? ` by ${item.updatedBy}` : ""}
              </dd>
            </dl>
          </section>
        </aside>
      </div>

      <AlertDialog
        open={publishOpen}
        onOpenChange={(open) => {
          if (!isPublishing) setPublishOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this knowledge?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{item.title}&quot; is processed and goes live in your
              assistant once that finishes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPublishing}
              onClick={(event) => {
                event.preventDefault();
                void handlePublish();
              }}
            >
              {isPublishing ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Publishing…
                </>
              ) : (
                "Publish"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setDeleteOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this knowledge?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{item.title}&quot;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
