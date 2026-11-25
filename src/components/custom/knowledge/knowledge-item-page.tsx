"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconExternalLink,
  IconPencil,
  IconSend,
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
import { useIsBelowLg } from "@/hooks/use-narrow-viewport";
import { limitAttemptHandlers, limitReachedMessage } from "@/lib/input-limit";
import {
  FAQ_QUESTION_MAX_LENGTH,
  faqAnswerProblem,
  faqQuestionProblem,
} from "@/lib/faq-validation";
import { isValidWebsiteUrl, normalizeUrl } from "@/lib/url";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchKnowledgeItem,
  PublishKnowledgeItems,
  UpdateKnowledgeItem,
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
  UnsavedChangesDialog,
  type UnsavedChangesDialogHandle,
} from "@/components/custom/unsaved-changes-dialog";
import {
  FAQ_ANSWER_MAX_LENGTH,
  isKnowledgeItemEditable,
  KNOWLEDGE_SOURCE_LABEL,
} from "@/components/custom/knowledge/knowledge-meta";
import {
  KnowledgeCategoriesField,
  useKnowledgeCategoryOptions,
} from "@/components/custom/knowledge/knowledge-category-picker";
import { KnowledgeScopePanel } from "@/components/custom/knowledge/knowledge-scope-panel";
import {
  KnowledgeSettingsButton,
  KnowledgeSettingsDrawer,
} from "@/components/custom/knowledge/knowledge-settings-drawer";
import {
  scopeOfItem,
  scopeToPayload,
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

const sameSet = (a: (string | number)[], b: (string | number)[]) =>
  a.length === b.length && a.every((entry) => b.includes(entry));

const idsOf = (entries: { id: string }[] | undefined) =>
  (entries ?? []).map((entry) => entry.id);

/** Whether where an item applies (the whole store, or its products, categories
 * or collections) differs from what it was saved with. */
const appliesToChanged = (scope: KnowledgeScope, saved: KnowledgeItem) =>
  scopeToPayload(scope).type !== saved.type ||
  !sameSet(idsOf(scope.products), idsOf(saved.products)) ||
  !sameSet(idsOf(scope.categories), idsOf(saved.categories)) ||
  !sameSet(idsOf(scope.collections), idsOf(saved.collections));

const categoryIdsOf = (item: KnowledgeItem) =>
  (item.knowledgeCategories ?? []).map((category) => category.id);

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
  const [knowledgeCategories, setKnowledgeCategories] = useState<number[]>([]);
  const { options: categoryOptions, isLoading: categoriesLoading } =
    useKnowledgeCategoryOptions();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [url, setUrl] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  // A field's problem shows once it was left, or once saving was tried.
  const [questionTouched, setQuestionTouched] = useState(false);
  const [answerTouched, setAnswerTouched] = useState(false);
  // Set when someone tries to type past a limit; shown until they edit or
  // leave the field.
  const [questionLimitHit, setQuestionLimitHit] = useState(false);
  const [answerLimitHit, setAnswerLimitHit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [publishOpen, setPublishOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // On a tablet or phone the usage and details panel is a drawer, opened
  // from the header.
  const belowLg = useIsBelowLg();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        setKnowledgeCategories(categoryIdsOf(loaded));
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

  // Back asks first when there are edits that are not saved.
  const unsavedChanges = useRef<UnsavedChangesDialogHandle>(null);
  const goBack = () =>
    unsavedChanges.current?.confirmLeave(() => router.back());

  const cancelEdit = () => {
    if (!item) return;
    setScope(scopeOfItem(item));
    setKnowledgeCategories(categoryIdsOf(item));
    setQuestion(item.question ?? "");
    setAnswer(item.answer ?? "");
    setUrl(item.url ?? "");
    setShowErrors(false);
    setQuestionTouched(false);
    setAnswerTouched(false);
    setEditing(false);
  };

  // Only what changed is sent. A changed website address is the one edit that
  // sends the item through processing again; the question and answer are
  // embedded again by the backend; everything else (categories, where it
  // applies, which AI use it) updates the database and the stored vectors in
  // place.
  const scopeChanged =
    item !== null &&
    scope !== null &&
    (!sameSet(scope.aiScope, item.aiScope) || appliesToChanged(scope, item));
  const categoriesChanged =
    item !== null && !sameSet(knowledgeCategories, categoryIdsOf(item));
  const faqChanged =
    item?.source === "faq" &&
    (question.trim() !== item.question || answer.trim() !== item.answer);
  const urlChanged = item?.source === "url" && normalizeUrl(url) !== item.url;
  const isDirty =
    editing && (scopeChanged || categoriesChanged || faqChanged || urlChanged);

  /** Saves the edits; resolves true once they are saved. */
  const handleSave = async () => {
    if (!item || !scope || !storeCode) return false;

    setShowErrors(true);
    const faqInvalid =
      item.source === "faq" &&
      Boolean(faqQuestionProblem(question) || faqAnswerProblem(answer));
    const urlInvalid =
      item.source === "url" && (!url.trim() || !isValidWebsiteUrl(url));
    const scopeErrors = validateScope(scope);
    if (
      scopeErrors.aiScope ||
      scopeErrors.selection ||
      faqInvalid ||
      urlInvalid
    )
      return false;

    if (!scopeChanged && !categoriesChanged && !faqChanged && !urlChanged) {
      setEditing(false);
      return true;
    }

    setIsSaving(true);
    const result = await dispatch(
      UpdateKnowledgeItem({
        id: item.id,
        storeCode,
        patch: {
          source: item.source,
          ...scopeToPayload(scope),
          knowledgeCategoryIds: knowledgeCategories,
          ...(faqChanged
            ? { question: question.trim(), answer: answer.trim() }
            : {}),
          ...(urlChanged ? { url: normalizeUrl(url) } : {}),
        },
      }),
    );
    setIsSaving(false);
    if (!UpdateKnowledgeItem.fulfilled.match(result)) {
      reload();
      return false;
    }

    setShowErrors(false);
    setEditing(false);
    reload();
    return true;
  };

  const handlePublish = async () => {
    if (!storeCode) return;
    setIsPublishing(true);
    await dispatch(PublishKnowledgeItems({ ids: [itemId], storeCode }));
    setIsPublishing(false);
    setPublishOpen(false);
    reload();
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
        <Button variant="outline" onClick={() => router.back()}>
          Back To Knowledge
        </Button>
      </div>
    );
  }

  const extension = (fileExtension(item) ?? "").toUpperCase();
  const scopeErrors = showErrors ? validateScope(scope) : {};
  const questionProblem = questionLimitHit
    ? limitReachedMessage(FAQ_QUESTION_MAX_LENGTH)
    : showErrors || questionTouched
      ? faqQuestionProblem(question)
      : undefined;
  const answerProblem = answerLimitHit
    ? limitReachedMessage(FAQ_ANSWER_MAX_LENGTH)
    : showErrors || answerTouched
      ? faqAnswerProblem(answer)
      : undefined;

  const settingsPanel = (
    <>
      <KnowledgeCategoriesField
        options={categoryOptions}
        isLoading={categoriesLoading}
        value={knowledgeCategories}
        onChange={setKnowledgeCategories}
        disabled={!editing}
        hint="Helps you find and group this in Knowledge."
      />

      <hr />

      <KnowledgeScopePanel
        value={scope}
        onChange={setScope}
        bordered={false}
        appliesToLocked={!editing}
        usedByLocked={!editing}
        showErrors={Boolean(scopeErrors.aiScope || scopeErrors.selection)}
        description={
          editing
            ? "Choose where it applies and which AI use it, then save."
            : "Press Edit to change where it applies and who uses it."
        }
      />

      <hr />

      <section className="flex flex-col gap-2 text-xs">
        <h2 className="text-sm font-semibold">Details</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Source</dt>
          <dd>{KNOWLEDGE_SOURCE_LABEL[item.source]}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <KnowledgeStatusBadge status={item.status} />
          </dd>
          {item.createdBy && (
            <>
              <dt className="text-muted-foreground">Added By</dt>
              <dd>{item.createdBy}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Added</dt>
          <dd>{formatDate(item.createdAt)}</dd>
          <dt className="text-muted-foreground">Last Updated</dt>
          <dd>
            {formatDate(item.updatedAt)}
            {item.updatedBy ? ` by ${item.updatedBy}` : ""}
          </dd>
        </dl>
      </section>
    </>
  );

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={goBack}>
          <IconArrowLeft className="size-4" />
          Knowledge
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
          {belowLg && (
            <KnowledgeSettingsButton
              invalid={Boolean(scopeErrors.aiScope || scopeErrors.selection)}
              onClick={() => setSettingsOpen(true)}
            />
          )}
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
                Save Changes
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
        </div>
      </header>

      <div className="grid flex-1 desktop:grid-cols-[minmax(0,1fr)_20rem]">
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
                  item.source === "faq" ? "Question & Answer" : "Website Page"
                }
              />
            )}
            <Stat label="Added" value={formatDate(item.createdAt)} />
            <Stat label="Last Updated" value={formatDate(item.updatedAt)} />
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
              <h2 className="text-sm font-semibold">Question And Answer</h2>
              {editing ? (
                <div className="flex flex-col gap-4 rounded-xl border p-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="faq-question"
                      className="text-xs font-medium"
                    >
                      Customer Asks
                    </label>
                    <Input
                      id="faq-question"
                      value={question}
                      maxLength={FAQ_QUESTION_MAX_LENGTH}
                      autoComplete="off"
                      onChange={(event) => {
                        setQuestion(event.target.value);
                        setQuestionLimitHit(false);
                      }}
                      {...limitAttemptHandlers<HTMLInputElement>(
                        FAQ_QUESTION_MAX_LENGTH,
                        () => setQuestionLimitHit(true),
                      )}
                      onBlur={() => {
                        setQuestionTouched(true);
                        setQuestionLimitHit(false);
                      }}
                      aria-invalid={Boolean(questionProblem)}
                    />
                    <div className="flex items-center justify-between gap-2">
                      {questionProblem ? (
                        <p className="text-xs text-destructive">
                          {questionProblem}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span
                        className={cn(
                          "text-xs text-muted-foreground",
                          question.length >= FAQ_QUESTION_MAX_LENGTH &&
                            "text-destructive",
                        )}
                      >
                        {question.length.toLocaleString()} /{" "}
                        {FAQ_QUESTION_MAX_LENGTH.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="faq-answer" className="text-xs font-medium">
                      Your Answer
                    </label>
                    <Textarea
                      id="faq-answer"
                      className="max-h-96 min-h-28 resize-y"
                      value={answer}
                      maxLength={FAQ_ANSWER_MAX_LENGTH}
                      onChange={(event) => {
                        setAnswer(event.target.value);
                        setAnswerLimitHit(false);
                      }}
                      {...limitAttemptHandlers<HTMLTextAreaElement>(
                        FAQ_ANSWER_MAX_LENGTH,
                        () => setAnswerLimitHit(true),
                      )}
                      onBlur={() => {
                        setAnswerTouched(true);
                        setAnswerLimitHit(false);
                      }}
                      aria-invalid={Boolean(answerProblem)}
                    />
                    <div className="flex items-center justify-between gap-2">
                      {answerProblem ? (
                        <p className="text-xs text-destructive">
                          {answerProblem}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span
                        className={cn(
                          "text-xs text-muted-foreground",
                          answer.length >= FAQ_ANSWER_MAX_LENGTH &&
                            "text-destructive",
                        )}
                      >
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
                <h2 className="text-sm font-semibold">Page Address</h2>
                <Input
                  value={url}
                  autoComplete="off"
                  aria-label="Page address"
                  onChange={(event) => setUrl(event.target.value)}
                  aria-invalid={showErrors && !isValidWebsiteUrl(url)}
                />
                {showErrors && !isValidWebsiteUrl(url) ? (
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
                  action="Open Page"
                />
              )
            ))}

          {item.source === "file" && item.fileUrl && (
            <SourceLink
              label="Document"
              href={item.fileUrl}
              text={item.fileName || item.title}
              action="View Document"
            />
          )}
        </main>

        {!belowLg && (
          <aside className="flex flex-col gap-5 border-l p-4">
            {settingsPanel}
          </aside>
        )}
      </div>

      <KnowledgeSettingsDrawer
        open={settingsOpen && belowLg}
        onOpenChange={setSettingsOpen}
        description="Which assistants use this, where it applies, and when it was added."
      >
        {settingsPanel}
      </KnowledgeSettingsDrawer>

      <AlertDialog
        open={publishOpen}
        onOpenChange={(open) => {
          if (!isPublishing) setPublishOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish This Knowledge?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="font-semibold break-words text-foreground">
                {item.title}
              </strong>{" "}
              is processed and goes live in your assistant once that finishes.
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

      <UnsavedChangesDialog
        ref={unsavedChanges}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </div>
  );
}
