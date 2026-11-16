"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconArrowLeft, IconCloud, IconWorld } from "@tabler/icons-react";

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
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsBelowLg } from "@/hooks/use-narrow-viewport";
import {
  ARTICLE_BODY_MAX_LENGTH,
  ARTICLE_TITLE_MAX_LENGTH,
} from "@/lib/config";
import { richTextToPlainText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItemsBulk,
  FetchKnowledgeItem,
  PublishKnowledgeItems,
  UpdateKnowledgeItem,
  type KnowledgeItem,
  type KnowledgeStatus,
} from "@/redux/api-slice/knowledge-rag-slice";

import { ArticleEditor } from "@/components/custom/knowledge/article-editor";
import { KnowledgeStatusBadge } from "@/components/custom/knowledge/knowledge-badges";
import { KnowledgeScopePanel } from "@/components/custom/knowledge/knowledge-scope-panel";
import {
  DEFAULT_KNOWLEDGE_SCOPE,
  describeScope,
  scopeKindToType,
  scopeOfItem,
  scopeToPayload,
  validateScope,
  type KnowledgeScope,
} from "@/components/custom/knowledge/knowledge-scope";
import { AI_SCOPE_META } from "@/components/custom/knowledge/knowledge-meta";
import {
  KnowledgeSettingsButton,
  KnowledgeSettingsDrawer,
} from "@/components/custom/knowledge/knowledge-settings-drawer";

/** The fewest visible characters an article needs to be published (the
 * backend's `KNOWLEDGE_ARTICLE_MIN_LENGTH`). */
const MIN_PUBLISH_LENGTH = 30;
/** How long after the last edit a draft is saved by itself. */
const AUTOSAVE_DELAY_MS = 1500;

type SaveState = "idle" | "saving" | "saved" | "error";

/** Identifies an article's editable content, to tell whether it changed. */
const contentKey = (title: string, html: string, scope: KnowledgeScope) =>
  JSON.stringify([title.trim(), html, scope]);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Writes or edits one article. A new article is created by its first save and
 * kept as a draft that saves itself as you type; publishing is a separate,
 * confirmed step. Editing a published article saves a draft of the changes
 * and leaves the live version alone: the assistant keeps using what was
 * published until "Publish changes".
 */
export function ArticleEditorPage({ articleId }: { articleId?: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">(
    articleId ? "loading" : "ready",
  );
  const [id, setId] = useState<string | null>(articleId ?? null);
  const [status, setStatus] = useState<KnowledgeStatus>("draft");
  const [initialHtml, setInitialHtml] = useState("");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [scope, setScope] = useState<KnowledgeScope>(DEFAULT_KNOWLEDGE_SCOPE);
  const [meta, setMeta] = useState<Pick<
    KnowledgeItem,
    | "createdAt"
    | "updatedAt"
    | "createdBy"
    | "updatedBy"
    | "hasUnpublishedChanges"
  > | null>(null);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  // What was last saved (or loaded), to tell whether anything has changed since.
  const [savedKey, setSavedKey] = useState<string | null>(null);
  // The same, readable by a save that starts before the state has re-rendered.
  const savedRef = useRef<{ key: string | null }>({ key: null });
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // On a tablet or phone the settings panel is a drawer, opened from the header.
  const belowLg = useIsBelowLg();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isLive = status !== "draft";
  // A published article edited since it went live: the assistant still uses the
  // version that was published, until these changes are published.
  const hasUnpublishedChanges = meta?.hasUnpublishedChanges ?? false;
  // Only a draft or published article can be edited; one that is being
  // processed (or failed) has to settle first.
  const isLocked = isLive && status !== "published";
  const scopeErrors = validateScope(scope);
  const hasScopeError = Boolean(scopeErrors.aiScope || scopeErrors.selection);
  const words = useMemo(
    () => richTextToPlainText(html).split(/\s+/).filter(Boolean).length,
    [html],
  );
  const titleLength = title.trim().length;
  const bodyLength = richTextToPlainText(html).length;
  const titleOver = titleLength > ARTICLE_TITLE_MAX_LENGTH;
  const bodyOver = bodyLength > ARTICLE_BODY_MAX_LENGTH;
  const overLimit = titleOver || bodyOver;

  // --- Loading an existing article -----------------------------------------
  useEffect(() => {
    if (!articleId || !storeCode) return;
    let cancelled = false;

    void dispatch(FetchKnowledgeItem({ id: articleId, storeCode })).then(
      (result) => {
        if (cancelled) return;
        if (
          !FetchKnowledgeItem.fulfilled.match(result) ||
          result.payload.source !== "article"
        ) {
          setLoadState("missing");
          return;
        }
        const item = result.payload;
        setStatus(item.status);
        setTitle(item.title);
        setInitialHtml(item.content ?? "");
        setHtml(item.content ?? "");
        setScope(scopeOfItem(item));
        setMeta(item);
        const key = contentKey(
          item.title,
          item.content ?? "",
          scopeOfItem(item),
        );
        savedRef.current.key = key;
        setSavedKey(key);
        setLoadState("ready");
      },
    );

    return () => {
      cancelled = true;
    };
  }, [dispatch, articleId, storeCode]);

  // --- Saving ---------------------------------------------------------------
  // Saves run one at a time, each reading the latest values, so a slow save
  // never overwrites a newer edit with an old one; one with nothing new to
  // write (the same title, body and scope as the last save) does nothing.
  const idRef = useRef(id);
  const latest = useRef({ title, html, scope });
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  useEffect(() => {
    idRef.current = id;
    latest.current = { title, html, scope };
  });

  const currentKey = useMemo(
    () => contentKey(title, html, scope),
    [title, html, scope],
  );
  const isDirty = currentKey !== savedKey;

  const runSave = async (silent: boolean): Promise<boolean> => {
    const current = latest.current;
    const carried = contentKey(current.title, current.html, current.scope);
    if (!storeCode) return false;
    if (idRef.current && savedRef.current.key === carried) return true;
    const scopeProblem = validateScope(current.scope);
    if (!current.html || scopeProblem.aiScope || scopeProblem.selection)
      return false;
    // Over a limit, the backend would refuse it, so nothing is sent.
    if (
      current.title.trim().length > ARTICLE_TITLE_MAX_LENGTH ||
      richTextToPlainText(current.html).length > ARTICLE_BODY_MAX_LENGTH
    )
      return false;

    setSaveState("saving");
    const shared = scopeToPayload(current.scope);
    let ok = false;

    if (!idRef.current) {
      const result = await dispatch(
        CreateKnowledgeItemsBulk({
          storeCode,
          source: "article",
          ...shared,
          items: [{ title: current.title.trim(), content: current.html }],
          publish: false,
          silent: true,
        }),
      );
      if (CreateKnowledgeItemsBulk.fulfilled.match(result)) {
        const created = result.payload[0];
        idRef.current = created.id;
        setId(created.id);
        setMeta(created);
        // The address now names the article, without reloading the page.
        window.history.replaceState(
          null,
          "",
          `/knowledge/articles/${created.id}`,
        );
        ok = true;
      }
    } else {
      const result = await dispatch(
        UpdateKnowledgeItem({
          id: idRef.current,
          storeCode,
          silent,
          patch: {
            source: "article",
            type: scopeKindToType(current.scope.scopeKind),
            title: current.title.trim(),
            content: current.html,
            aiScope: shared.aiScope,
            productIds: shared.productIds,
            categoryIds: shared.categoryIds,
            collectionIds: shared.collectionIds,
          },
        }),
      );
      if (UpdateKnowledgeItem.fulfilled.match(result)) {
        setMeta(result.payload);
        setStatus(result.payload.status);
        ok = true;
      }
    }

    if (ok) {
      savedRef.current.key = carried;
      setSavedKey(carried);
      setSavedAt(new Date());
    }
    setSaveState(ok ? "saved" : "error");
    return ok;
  };

  const save = (silent = true) => {
    queue.current = queue.current.then(() => runSave(silent));
    return queue.current;
  };

  // Edits save themselves shortly after you stop typing. For a published
  // article that only changes its working copy; what the assistant uses stays
  // as it was until the changes are published.
  const snapshot = useMemo(
    () => ({ title, html, scope }),
    [title, html, scope],
  );
  const debounced = useDebounce(snapshot, AUTOSAVE_DELAY_MS);
  useEffect(() => {
    if (loadState !== "ready" || isLocked) return;
    void save();
    // Only a settled edit should trigger a save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // --- Publishing -----------------------------------------------------------
  const requestPublish = () => {
    setShowErrors(true);
    if (hasScopeError) setSettingsOpen(true);
    if (hasScopeError || overLimit) return;
    if (richTextToPlainText(html).length < MIN_PUBLISH_LENGTH) return;
    setPublishOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!storeCode) return;
    setIsPublishing(true);
    const saved = await save();
    const articleIdToPublish = idRef.current;
    if (saved && articleIdToPublish) {
      const result = await dispatch(
        PublishKnowledgeItems({ ids: [articleIdToPublish], storeCode }),
      );
      if (
        PublishKnowledgeItems.fulfilled.match(result) &&
        result.payload.publishedIds.length > 0
      ) {
        router.push("/knowledge");
        return;
      }
    }
    setIsPublishing(false);
    setPublishOpen(false);
  };

  // --- Rendering ------------------------------------------------------------
  if (loadState === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Loading article…
      </div>
    );
  }

  if (loadState === "missing") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <p className="font-semibold">We couldn&apos;t find this article</p>
        <p className="text-sm text-muted-foreground">
          It may have been deleted, or it belongs to another store.
        </p>
        <Button asChild variant="outline">
          <Link href="/knowledge">Back to Knowledge</Link>
        </Button>
      </div>
    );
  }

  const tooShort = showErrors && bodyLength < MIN_PUBLISH_LENGTH;
  const aiLabels = scope.aiScope
    .map((entry) => AI_SCOPE_META[entry].label)
    .join(", ");
  const saveText =
    saveState === "saving"
      ? "Saving…"
      : saveState === "error"
        ? "Couldn't save"
        : isLive && isDirty
          ? "Unsaved changes"
          : isLive && hasUnpublishedChanges
            ? "Draft saved · not published yet"
            : savedAt
              ? `Saved ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "Not saved yet";

  const settingsPanel = (
    <>
      <KnowledgeScopePanel
        value={scope}
        onChange={(next) => {
          setScope(next);
        }}
        bordered={false}
        showErrors={showErrors}
        description={
          scope.scopeKind === "general"
            ? "Applies to your whole store."
            : `Used for ${
                scope.products
                  .concat(scope.categories, scope.collections)
                  .map((entry) => entry.name.toLowerCase())
                  .join(", ") || "the items you pick"
              } questions only.`
        }
      />

      {meta && (
        <>
          <hr />
          <section className="flex flex-col gap-2 text-xs">
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-muted-foreground">Created</dt>
              <dd>
                {formatDate(meta.createdAt)}
                {meta.createdBy ? ` by ${meta.createdBy}` : ""}
              </dd>
              <dt className="text-muted-foreground">Last edited</dt>
              <dd>
                {formatDate(meta.updatedAt)}
                {meta.updatedBy ? ` by ${meta.updatedBy}` : ""}
              </dd>
            </dl>
          </section>
        </>
      )}
    </>
  );

  return (
    // The editor fills the screen and only the text scrolls.
    <div className="flex h-app-screen min-h-0 flex-col overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/knowledge">
            <IconArrowLeft className="size-4" />
            Knowledge
          </Link>
        </Button>

        <div className="flex min-w-0 flex-1 basis-40 items-center gap-2 text-sm">
          <span className="truncate font-medium">
            {title.trim() || "Untitled article"}
          </span>
          <KnowledgeStatusBadge status={status} />
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 text-xs text-muted-foreground",
              saveState === "error" && "text-destructive",
            )}
            aria-live="polite"
          >
            <IconCloud className="size-3.5" />
            {saveText}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {belowLg && (
            <KnowledgeSettingsButton
              invalid={showErrors && hasScopeError}
              onClick={() => setSettingsOpen(true)}
            />
          )}
          {/* A draft can be published as it is, so Publish only needs some text;
              a live article is published again only when it has changes to
              publish. Edits save themselves, so there is no Save button. */}
          <Button
            type="button"
            size="sm"
            disabled={
              isLocked ||
              !html ||
              overLimit ||
              isPublishing ||
              (isLive && !isDirty && !hasUnpublishedChanges)
            }
            onClick={requestPublish}
          >
            <IconWorld className="size-4" />
            {isLive ? "Publish changes" : "Publish"}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] desktop:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="flex min-h-0 min-w-0 flex-col">
          {isLocked && (
            <p
              role="status"
              className="border-b bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
            >
              {status === "failed"
                ? "This article couldn't be processed, so it can't be edited."
                : "This article is being processed. You can edit it again once it's live."}
            </p>
          )}

          <div className="px-4 pt-6 sm:px-8">
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
              }}
              disabled={isLocked}
              placeholder="Untitled article"
              aria-label="Article title"
              maxLength={ARTICLE_TITLE_MAX_LENGTH}
              aria-invalid={titleOver}
              className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/60 disabled:opacity-70"
            />
            {titleLength >= ARTICLE_TITLE_MAX_LENGTH * 0.8 && (
              <p
                className={cn(
                  "mt-1 text-right text-xs text-muted-foreground",
                  titleOver && "text-destructive",
                )}
              >
                {titleLength} / {ARTICLE_TITLE_MAX_LENGTH}
                {titleOver && " · the title is too long"}
              </p>
            )}
          </div>

          <ArticleEditor
            initialHtml={initialHtml}
            disabled={isLocked}
            onChange={(next) => {
              setHtml(next);
            }}
          />
          <p
            role={bodyOver ? "alert" : undefined}
            className={cn(
              "px-4 pb-2 text-right text-xs text-muted-foreground sm:px-8",
              bodyOver && "text-destructive",
            )}
          >
            {bodyLength.toLocaleString()} /{" "}
            {ARTICLE_BODY_MAX_LENGTH.toLocaleString()} characters
            {bodyOver &&
              " · too long to save or publish, please shorten the article"}
          </p>
          {tooShort && (
            <p
              role="alert"
              className="px-4 pb-6 text-xs text-destructive sm:px-8"
            >
              The article text needs at least {MIN_PUBLISH_LENGTH} characters
              before it can be published ({bodyLength} so far). The title can be
              as short as you like.
            </p>
          )}
        </main>

        {!belowLg && (
          <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-l p-4">
            {settingsPanel}
          </aside>
        )}
      </div>

      <KnowledgeSettingsDrawer
        open={settingsOpen && belowLg}
        onOpenChange={setSettingsOpen}
        description="Which assistants use this article, where it applies, and when it was last edited."
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
            <AlertDialogTitle>
              {isLive ? "Publish your changes?" : "Publish this article?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isLive ? (
                <>
                  Your assistant switches to this version of{" "}
                  <strong className="font-semibold break-words text-foreground">
                    {title.trim() || "Untitled article"}
                  </strong>{" "}
                  as soon as it&apos;s published. Until then it keeps using the
                  version that&apos;s live now.
                </>
              ) : (
                <>
                  Your assistant starts answering from{" "}
                  <strong className="font-semibold break-words text-foreground">
                    {title.trim() || "Untitled article"}
                  </strong>{" "}
                  as soon as it&apos;s published.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y py-3 text-sm">
            <dt className="text-muted-foreground">Used by</dt>
            <dd>{aiLabels || "—"}</dd>
            <dt className="text-muted-foreground">Applies to</dt>
            <dd>{describeScope(scope)}</dd>
            <dt className="text-muted-foreground">Length</dt>
            <dd>{words.toLocaleString()} words</dd>
          </dl>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPublishing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPublishing}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmPublish();
              }}
            >
              {isPublishing ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Publishing…
                </>
              ) : (
                <>
                  <IconWorld />
                  Publish
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
