"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCircleCheck,
  IconPencil,
  IconPlus,
  IconTrash,
  IconWorldSearch,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import {
  KNOWLEDGE_FAQ_CAP,
  KNOWLEDGE_FILE_CAP,
  KNOWLEDGE_SPECIFIC_PAGE_CAP,
  KNOWLEDGE_TITLE_MAX_LENGTH,
  KNOWLEDGE_TITLE_MIN_LENGTH,
  KNOWLEDGE_URL_INPUT_DELAY_MS,
  KNOWLEDGE_WEBSITE_URL_CAP,
} from "@/lib/config";
import { useDebounce } from "@/hooks/use-debounce";
import {
  isSiteAddress,
  parseUrlList,
  spacesToNewLines,
  stripUrlSpaces,
  urlListProblem,
} from "@/lib/url";
import { randomId } from "@/lib/utils";

import {
  AddKnowledgeStepper,
  ContentLayout,
  PrimaryAction,
  ShopifySyncedNote,
  SOURCE_META,
  SourceCards,
  StepFooter,
  TipCard,
  type AddableSource,
  type AddStep,
} from "@/components/custom/knowledge/add-knowledge-parts";
import {
  KNOWLEDGE_FILE_MAX_SIZE_BYTES,
  MultiFileUploadDropzone,
} from "@/components/custom/knowledge/file-upload-dropzone";
import {
  KnowledgeCategoriesField,
  useKnowledgeCategoryOptions,
  type KnowledgeCategoryOption,
} from "@/components/custom/knowledge/knowledge-category-picker";
import { KnowledgeStorageNotice } from "@/components/custom/knowledge/knowledge-storage-notice";
import { KnowledgeScopePanel } from "@/components/custom/knowledge/knowledge-scope-panel";
import {
  DEFAULT_KNOWLEDGE_SCOPE,
  scopeToPayload,
  validateScope,
  type KnowledgeScope,
} from "@/components/custom/knowledge/knowledge-scope";
import { FAQ_ANSWER_MAX_LENGTH } from "@/components/custom/knowledge/knowledge-meta";
import { WebsiteUrlDiscovery } from "@/components/custom/knowledge/website-url-discovery";
import {
  UnsavedChangesDialog,
  type UnsavedChangesDialogHandle,
} from "@/components/custom/unsaved-changes-dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItemsBulk,
  FetchKnowledgeStats,
  type BulkKnowledgeItemContent,
  type DiscoveredPage,
} from "@/redux/api-slice/knowledge-rag-slice";

type ContentSource = Exclude<AddableSource, "article">;

type FaqRow = { localId: string; question: string; answer: string };
/** A chosen document with the knowledge categories it is filed under. */
type DocumentRow = { localId: string; file: File; categories: number[] };

/** Server errors for the last submit, by the id of the row each belongs to. */
type ServerErrors = Record<string, Record<string, unknown>>;

const emptyFaqRow = (): FaqRow => ({
  localId: randomId(),
  question: "",
  answer: "",
});

const TIPS: Record<ContentSource, { title: string; body: string }> = {
  url: {
    title: "Pick Pages That Answer Questions",
    body: "Policies, FAQs, size guides and contact pages work best. Blog posts and job pages rarely help shoppers.",
  },
  file: {
    title: "Scope It Tightly",
    body: "A size guide set to Apparel is only used when shoppers ask about apparel. Store-wide documents are checked for every question.",
  },
  faq: {
    title: "Write It Like A Reply",
    body: "Your assistant uses your answer as written, so keep the tone you use with customers.",
  },
};

/** The first message in whatever shape a server error came back as: a plain
 * string, an array of strings, or a nested object (DRF field-error style). */
function firstErrorMessage(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(String).find(Boolean);
  if (typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const message = firstErrorMessage(nested);
      if (message) return message;
    }
  }
  return undefined;
}

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

export function NewKnowledgePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const sourceParam = useSearchParams()?.get("source");

  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  // Scanning starts from the store's own site; the user can point it elsewhere.
  const storeUrl = useAppSelector(
    (state) =>
      state.GetStoresReducer.GetStoresState.GetStoresListData.find(
        (store) => store.code === state.GetStoresReducer.selectedStore,
      )?.url ?? "",
  );
  const { FetchKnowledgeStatsData: stats } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeStatsState,
  );
  const { DiscoverWebsiteUrlsListData: discoveredPages } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.DiscoverWebsiteUrlsState,
  );
  const { options: categoryOptions, isLoading: categoriesLoading } =
    useKnowledgeCategoryOptions();
  const { CreateKnowledgeItemsBulkIsLoading: isSubmitting } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.CreateKnowledgeItemsBulkState,
  );

  // `?source=` (from the empty Knowledge screen) opens straight on that kind.
  const initialSource = (["url", "file", "faq", "article"] as const).find(
    (value) => value === sourceParam,
  );
  const [source, setSource] = useState<AddableSource | null>(
    initialSource ?? null,
  );
  const [step, setStep] = useState<AddStep>(
    initialSource && initialSource !== "article" ? "content" : "source",
  );
  const [scope, setScope] = useState<KnowledgeScope>(DEFAULT_KNOWLEDGE_SCOPE);

  const [selectedPageUrls, setSelectedPageUrls] = useState<string[]>([]);
  // The categories of each page ticked from a scan, by its address.
  const [pageCategories, setPageCategories] = useState<
    Record<string, number[]>
  >({});
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [faqRows, setFaqRows] = useState<FaqRow[]>([emptyFaqRow()]);
  // One set of categories for every question added together.
  const [faqCategories, setFaqCategories] = useState<number[]>([]);

  const [showErrors, setShowErrors] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  // Server errors from the last failed submit, by the stable id of the row each
  // came from (never by position, which shifts when a row is removed).
  const [serverErrors, setServerErrors] = useState<ServerErrors>({});
  // The page the banner is about, so it goes when that page is deselected.
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [added, setAdded] = useState<{
    count: number;
    label: string;
    /** How many were sent, so the ones declined for storage can be counted. */
    sent: number;
  } | null>(null);

  useEffect(() => {
    if (storeCode) dispatch(FetchKnowledgeStats({ storeCode }));
  }, [dispatch, storeCode]);

  const unsavedChanges = useRef<UnsavedChangesDialogHandle>(null);

  const goToLibrary = () =>
    unsavedChanges.current?.confirmLeave(() => {
      // The library keeps its filters in its URL, so stepping back in
      // history restores the same view; a direct visit has nothing behind it.
      if (window.history.length > 1) router.back();
      else router.push("/knowledge");
    });

  // --- What is ready to add -------------------------------------------------
  const filledFaqs = faqRows.filter(
    (row) => row.question.trim() || row.answer.trim(),
  );
  const completeFaqs = filledFaqs.filter(
    (row) => row.question.trim() && row.answer.trim(),
  );
  const readyCount =
    source === "url"
      ? selectedPageUrls.length
      : source === "file"
        ? documents.length
        : completeFaqs.length;
  // Anything picked or typed in that isn't added yet, half-filled
  // questions included.
  const isDirty =
    step === "content" &&
    (source === "faq" ? filledFaqs.length : readyCount) > 0;
  const alreadyAdded = discoveredPages.filter(
    (page) => page.alreadyAdded,
  ).length;

  const scopeErrors = validateScope(scope);
  const hasScopeError = Boolean(scopeErrors.aiScope || scopeErrors.selection);
  const hasIncompleteFaq =
    source === "faq" && filledFaqs.length > completeFaqs.length;
  // A scanned page brings its own title when it could be read; without one the
  // backend titles the page by its address.
  const scannedTitle = (url: string) => {
    const title = (
      discoveredPages.find((page) => page.url === url)?.title ?? ""
    )
      .trim()
      .slice(0, KNOWLEDGE_TITLE_MAX_LENGTH);
    return title.length >= KNOWLEDGE_TITLE_MIN_LENGTH ? title : "";
  };

  const resetContent = () => {
    setSelectedPageUrls([]);
    setPageCategories({});
    setDocuments([]);
    setFaqRows([emptyFaqRow()]);
    setFaqCategories([]);
    setShowErrors(false);
    setBanner(null);
    setBannerUrl(null);
    setServerErrors({});
  };

  const handleContinue = () => {
    if (!source) return;
    if (source === "article") {
      router.push("/knowledge/articles/new");
      return;
    }
    setStep("content");
  };

  /** Adds what is ready; resolves true once it was added. */
  const handleSubmit = async () => {
    if (!storeCode || !source || source === "article") return false;

    setShowErrors(true);
    setBanner(null);
    setBannerUrl(null);
    setServerErrors({});
    if (readyCount === 0 || hasScopeError || hasIncompleteFaq) return false;

    // Which row of the form each submitted item came from, so a server error
    // for item N can be shown on the right row.
    let items: BulkKnowledgeItemContent[] | undefined;
    // The stable id of each item sent, in the order sent.
    let itemIds: string[] = [];

    if (source === "url") {
      // Each page carries its own categories, which replace the request's.
      const withCategories = (categories: number[]) =>
        categories.length > 0 ? { knowledge_categories: categories } : {};
      items = selectedPageUrls.map((url) => {
        const title = scannedTitle(url);
        return {
          url,
          ...(title ? { title } : {}),
          ...withCategories(pageCategories[url] ?? []),
        };
      });
      itemIds = selectedPageUrls;
    } else if (source === "faq") {
      items = completeFaqs.map((row) => ({
        question: row.question.trim(),
        answer: row.answer.trim(),
      }));
      itemIds = completeFaqs.map((row) => row.localId);
    } else if (source === "file") {
      itemIds = documents.map((row) => row.localId);
    }

    // Everything but an article goes live as soon as it is added.
    const result = await dispatch(
      CreateKnowledgeItemsBulk({
        storeCode,
        source,
        ...scopeToPayload(scope),
        publish: true,
        ...(source === "faq" ? { knowledgeCategoryIds: faqCategories } : {}),
        ...(source === "file"
          ? {
              files: documents.map((row) => row.file),
              fileKnowledgeCategoryIds: documents.map((row) => row.categories),
            }
          : { items }),
      }),
    );

    if (CreateKnowledgeItemsBulk.fulfilled.match(result)) {
      setAdded({
        count: result.payload.length,
        sent: readyCount,
        label:
          source === "url"
            ? plural(result.payload.length, "Website Page")
            : source === "file"
              ? plural(result.payload.length, "Document")
              : plural(result.payload.length, "Question"),
      });
      setStep("done");
      dispatch(FetchKnowledgeStats({ storeCode }));
      return true;
    }

    const payload = result.payload as
      | { data?: unknown; message?: string }
      | undefined;
    if (Array.isArray(payload?.data)) {
      const errors = payload.data as Record<string, unknown>[];
      const byId: ServerErrors = {};
      errors.forEach((entry, index) => {
        const id = itemIds[index];
        if (id && entry && Object.keys(entry).length > 0) byId[id] = entry;
      });
      setServerErrors(byId);
      const failed = errors.findIndex(
        (entry) => entry && Object.keys(entry).length > 0,
      );
      if (source === "url" && failed >= 0) {
        setBannerUrl(itemIds[failed] ?? null);
        setBanner(
          `${itemIds[failed] ? `${itemIds[failed]}: ` : ""}${
            firstErrorMessage(errors[failed]) ?? "This page couldn't be added."
          }`,
        );
      }
    } else {
      setBanner(
        firstErrorMessage(payload?.data) ||
          payload?.message ||
          "We couldn't save your knowledge. Please check your entries and try again.",
      );
    }
    return false;
  };

  const startAgain = () => {
    resetContent();
    setSource(null);
    setAdded(null);
    setScope(DEFAULT_KNOWLEDGE_SCOPE);
    setStep("source");
  };

  // --- Layout ---------------------------------------------------------------
  const meta = source && source !== "article" ? SOURCE_META[source] : null;
  const tip = source && source !== "article" ? TIPS[source] : null;

  // With no storage left nothing can be added, so the button is off.
  const storage = stats?.vector_storage;
  const isStorageFull = storage ? storage.total >= storage.limit : false;
  const primaryLabel =
    source === "url"
      ? `Add ${plural(readyCount, "Page")}`
      : source === "file"
        ? `Add ${plural(readyCount, "Document")}`
        : `Add ${plural(readyCount, "Question")}`;
  const footerMessage = isStorageFull
    ? "Your storage is full. Free up space or upgrade your plan to add more."
    : source === "url"
      ? `${plural(readyCount, "page")} selected${
          alreadyAdded > 0 ? ` · ${alreadyAdded} already in your knowledge` : ""
        }`
      : source === "file"
        ? `${plural(documents.length, "file")} ready`
        : `${plural(completeFaqs.length, "question")} ready${
            faqRows.length > completeFaqs.length && !hasIncompleteFaq
              ? " · the empty one is skipped"
              : ""
          }`;

  return (
    <div className="flex min-h-full w-full flex-col gap-5 p-4">
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          disabled={isSubmitting}
          onClick={goToLibrary}
        >
          <IconArrowLeft className="size-4" />
          Knowledge
        </Button>
        <Typography variant="h4" as="h1">
          Add Knowledge
        </Typography>
        <Typography variant="muted" className="max-w-2xl">
          Choose what to add. Your assistant answers shoppers from your
          knowledge, plus your Shopify products, which stay synced, and your
          orders, which it reads live.
        </Typography>
      </div>

      <AddKnowledgeStepper step={step} />

      <KnowledgeStorageNotice storage={stats?.vector_storage ?? null} />

      {banner && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {banner}
        </div>
      )}

      {step === "source" && (
        <>
          <div className="flex flex-col gap-5">
            <SourceCards value={source} onChange={setSource} />
            <ShopifySyncedNote />
          </div>
          <StepFooter
            message={
              source ? "Ready when you are." : "Choose a source to continue."
            }
          >
            <Button type="button" variant="ghost" onClick={goToLibrary}>
              Cancel
            </Button>
            <Button type="button" disabled={!source} onClick={handleContinue}>
              Continue
            </Button>
          </StepFooter>
        </>
      )}

      {step === "content" && meta && source && source !== "article" && (
        <>
          <ContentLayout
            title={meta.title}
            icon={meta.icon}
            tone={meta.tone}
            changeSourceDisabled={isSubmitting}
            onChangeSource={() => {
              resetContent();
              setStep("source");
            }}
            side={
              <>
                <KnowledgeScopePanel
                  value={scope}
                  onChange={setScope}
                  showErrors={showErrors}
                />
                {tip && <TipCard title={tip.title}>{tip.body}</TipCard>}
              </>
            }
          >
            {source === "url" && (
              <WebsiteContent
                storeCode={storeCode}
                storeUrl={storeUrl}
                selectedPageUrls={selectedPageUrls}
                onSelectedPageUrlsChange={(next) => {
                  setSelectedPageUrls(next);
                  if (bannerUrl && !next.includes(bannerUrl)) {
                    setBanner(null);
                    setBannerUrl(null);
                  }
                }}
                pageCategories={pageCategories}
                onPageCategoriesChange={setPageCategories}
                categoryOptions={categoryOptions}
                categoriesLoading={categoriesLoading}
                siteCap={KNOWLEDGE_WEBSITE_URL_CAP}
                pageCap={KNOWLEDGE_SPECIFIC_PAGE_CAP}
                error={
                  showErrors && readyCount === 0
                    ? "Enter a website to scan, or the page links to add, then select the pages"
                    : undefined
                }
              />
            )}
            {source === "file" && (
              <DocumentsContent
                documents={documents}
                onDocumentsChange={setDocuments}
                categoryOptions={categoryOptions}
                categoriesLoading={categoriesLoading}
                serverErrors={serverErrors}
                error={
                  showErrors && documents.length === 0
                    ? "Select at least one file"
                    : undefined
                }
              />
            )}
            {source === "faq" && (
              <FaqContent
                rows={faqRows}
                onRowsChange={setFaqRows}
                categories={faqCategories}
                onCategoriesChange={setFaqCategories}
                categoryOptions={categoryOptions}
                categoriesLoading={categoriesLoading}
                showErrors={showErrors}
                serverErrors={serverErrors}
                onServerErrorsChange={setServerErrors}
                error={
                  showErrors && completeFaqs.length === 0 && !hasIncompleteFaq
                    ? "Add at least one question and answer"
                    : undefined
                }
              />
            )}
          </ContentLayout>

          <StepFooter message={footerMessage}>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={goToLibrary}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                resetContent();
                setStep("source");
              }}
            >
              Back
            </Button>
            <PrimaryAction
              type="button"
              loading={isSubmitting}
              disabled={readyCount === 0 || isStorageFull}
              onClick={() => void handleSubmit()}
            >
              {primaryLabel}
            </PrimaryAction>
          </StepFooter>
        </>
      )}

      {step === "done" && added && (
        <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <IconCircleCheck className="size-12 text-emerald-500" />
          <Typography variant="h4" as="h2">
            {added.label} Added
          </Typography>
          {added.sent > added.count && (
            <p
              role="status"
              className={`rounded-lg border px-3 py-2 text-sm ${BADGE_TONE_STYLES.warning}`}
            >
              {added.sent - added.count} of {added.sent} weren&apos;t added
              because they would go over your storage limit. Free up space or
              upgrade your plan, then add them again.
            </p>
          )}
          <Typography variant="muted">
            {source === "faq"
              ? "Your assistant can use them straight away."
              : "We're reading them now. Each one goes live in your assistant as soon as it's ready, and you can follow its progress in Knowledge."}
          </Typography>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/knowledge">View In Knowledge</Link>
            </Button>
            <Button type="button" variant="outline" onClick={startAgain}>
              Add More
            </Button>
          </div>
        </div>
      )}

      <UnsavedChangesDialog
        ref={unsavedChanges}
        isDirty={isDirty}
        isSaving={isSubmitting}
        onSave={handleSubmit}
      />
    </div>
  );
}

/** How long to wait after typing stops before reading the field. */

/**
 * The website step, one field for everything. A site's own address is scanned
 * (on "Find pages") and its pages listed to choose from. Links to specific
 * pages are checked on "Next" (each must be a page that can be read) and
 * listed the same way, all ticked to start with. Nothing is scanned or checked
 * until that button is pressed. Either way, every ticked page has its own
 * categories field. The two can't be mixed.
 */
function WebsiteContent({
  storeCode,
  storeUrl,
  selectedPageUrls,
  onSelectedPageUrlsChange,
  pageCategories,
  onPageCategoriesChange,
  categoryOptions,
  categoriesLoading,
  siteCap,
  pageCap,
  error,
}: {
  storeCode: string | null | undefined;
  /** The store's own site, offered as a shortcut. */
  storeUrl: string;
  selectedPageUrls: string[];
  onSelectedPageUrlsChange: (next: string[]) => void;
  /** The categories of each ticked page, by its address. */
  pageCategories: Record<string, number[]>;
  onPageCategoriesChange: (next: Record<string, number[]>) => void;
  categoryOptions: KnowledgeCategoryOption[];
  categoriesLoading: boolean;
  /** Most pages that can be ticked from a site scan. */
  siteCap: number;
  /** Most specific pages that can be listed in the field. */
  pageCap: number;
  error?: string;
}) {
  const [text, setText] = useState("");
  // Set once the button was pressed for what the field holds (`key`: the site,
  // or the pages joined); `run` makes it a fresh scan.
  const [scan, setScan] = useState<{
    kind: "site" | "pages";
    key: string;
    run: number;
  } | null>(null);

  // What the field holds is read once typing pauses, not on every key.
  const settledText = useDebounce(text, KNOWLEDGE_URL_INPUT_DELAY_MS);
  const parsed = useMemo(() => parseUrlList(settledText), [settledText]);
  const problem = urlListProblem(parsed, pageCap);
  const kind: "none" | "site" | "pages" =
    problem || parsed.urls.length === 0
      ? "none"
      : parsed.urls.length === 1 && isSiteAddress(parsed.urls[0])
        ? "site"
        : "pages";
  // What the button would scan or check, once the field holds something valid.
  const scanKey = kind === "none" ? null : parsed.urls.join("\n");

  // Only pages from the current kind of input can stay ticked.
  useEffect(() => {
    if (kind === "none") onSelectedPageUrlsChange([]);
    // Only a change in what the field holds matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const typing = text !== settledText;
  // Nothing is scanned or checked until the button is pressed.
  const started = Boolean(
    scan && !typing && scan.kind === kind && scan.key === scanKey,
  );

  // The field (a website, or page links) is locked while it is being scanned or
  // checked and once its pages are listed, so the list can't be left showing
  // another address's pages. Only "Change" unlocks it; a failed scan does too,
  // so the address can be fixed.
  const {
    DiscoverWebsiteUrlsIsLoading: scanning,
    DiscoverWebsiteUrlsIsSuccess: scanned,
    DiscoverWebsiteUrlsIsError: scanFailed,
    DiscoverWebsiteUrlsListData: discoveredPages,
  } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.DiscoverWebsiteUrlsState,
  );

  // A page whose address matches knowledge categories starts out filed under
  // them. A page the user has already set (even to none) is left as it is.
  useEffect(() => {
    const unset = discoveredPages.filter(
      (page) =>
        page.categoryIds.length > 0 && pageCategories[page.url] === undefined,
    );
    if (unset.length === 0) return;
    onPageCategoriesChange({
      ...pageCategories,
      ...Object.fromEntries(unset.map((page) => [page.url, page.categoryIds])),
    });
  }, [discoveredPages, pageCategories, onPageCategoriesChange]);
  const locked = started && !scanFailed;

  const changeAddress = () => {
    // The pages ticked came from the address being left.
    onSelectedPageUrlsChange([]);
    setScan(null);
  };

  // The categories field of each page that can be added, ticked or not.
  const renderCategories = (page: DiscoveredPage) => (
    <KnowledgeCategoriesField
      compact
      options={categoryOptions}
      isLoading={categoriesLoading}
      value={pageCategories[page.url] ?? []}
      onChange={(categories) =>
        onPageCategoriesChange({ ...pageCategories, [page.url]: categories })
      }
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <label htmlFor="website-address" className="text-sm font-semibold">
          Website Or Page Links
        </label>
        <Textarea
          id="website-address"
          className="max-h-48 min-h-16 resize-y"
          placeholder={`${storeUrl || "https://store.com"} to scan a website\nor paste up to ${pageCap} page links, one per line`}
          autoComplete="off"
          spellCheck={false}
          value={text}
          disabled={locked}
          // Addresses never hold a space: typing one does nothing, and spaces
          // in pasted text start a new line. Several addresses are one per line.
          onKeyDown={(event) => {
            if (event.key === " ") event.preventDefault();
          }}
          onPaste={(event) => {
            event.preventDefault();
            const field = event.currentTarget;
            const pasted = spacesToNewLines(
              event.clipboardData.getData("text"),
            );
            setText(
              stripUrlSpaces(
                field.value.slice(0, field.selectionStart) +
                  pasted +
                  field.value.slice(field.selectionEnd),
              ),
            );
            setScan(null);
          }}
          onChange={(event) => {
            setText(stripUrlSpaces(event.target.value));
            // A scan belongs to the address it was run for.
            setScan(null);
          }}
          aria-invalid={Boolean(problem) && !typing}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 flex-1 basis-60 text-xs text-muted-foreground">
            A website&apos;s own address (https://store.com) is scanned and you
            pick from the pages found. Links to specific pages (up to {pageCap})
            are checked when you press Next, then listed for you to pick from.
          </p>
          <div className="flex items-center gap-1">
            {storeUrl && !text.trim() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => setText(storeUrl)}
              >
                Use My Store
              </Button>
            )}
            {locked && scanned && !scanning && (
              <Button type="button" variant="outline" onClick={changeAddress}>
                <IconPencil className="size-4" />
                Change
              </Button>
            )}
            {/* Once it has started, its own list takes over. */}
            {kind !== "none" && scanKey && !typing && !started && (
              <Button
                type="button"
                variant="outline"
                disabled={!storeCode}
                onClick={() => setScan({ kind, key: scanKey, run: Date.now() })}
              >
                {kind === "site" ? (
                  <>
                    <IconWorldSearch className="size-4" />
                    Find Pages
                  </>
                ) : (
                  <>
                    Next
                    <IconArrowRight className="size-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        {problem && !typing && (
          <p role="alert" className="text-xs text-destructive">
            {problem}
          </p>
        )}
      </section>

      {started && scan && (
        <WebsiteUrlDiscovery
          key={scan.run}
          storeCode={storeCode}
          {...(scan.kind === "site"
            ? { websiteUrl: parsed.urls[0] }
            : { pageUrls: parsed.urls })}
          selectedUrls={selectedPageUrls}
          onSelectedUrlsChange={onSelectedPageUrlsChange}
          maxSelection={scan.kind === "site" ? siteCap : pageCap}
          renderPageExtra={renderCategories}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** The documents step: the drop area and the files chosen so far, each with
 * the categories it is filed under. */
function DocumentsContent({
  documents,
  onDocumentsChange,
  categoryOptions,
  categoriesLoading,
  serverErrors,
  error,
}: {
  documents: DocumentRow[];
  onDocumentsChange: (next: DocumentRow[]) => void;
  categoryOptions: KnowledgeCategoryOption[];
  categoriesLoading: boolean;
  serverErrors: ServerErrors;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <MultiFileUploadDropzone
        files={documents.map((row) => row.file)}
        onFilesSelected={(selected) =>
          onDocumentsChange(
            [
              ...documents,
              ...selected.map((file) => ({
                localId: randomId(),
                file,
                categories: [],
              })),
            ].slice(0, KNOWLEDGE_FILE_CAP),
          )
        }
        onRemoveFile={(index) =>
          onDocumentsChange(documents.filter((_, i) => i !== index))
        }
        renderFileExtra={(_, index) => (
          <KnowledgeCategoriesField
            compact
            options={categoryOptions}
            isLoading={categoriesLoading}
            value={documents[index]?.categories ?? []}
            onChange={(categories) =>
              onDocumentsChange(
                documents.map((row, i) =>
                  i === index ? { ...row, categories } : row,
                ),
              )
            }
          />
        )}
        errors={documents.map((row) =>
          serverErrors[row.localId]
            ? firstErrorMessage(serverErrors[row.localId])
            : undefined,
        )}
        maxFiles={KNOWLEDGE_FILE_CAP}
        maxFileSizeBytes={KNOWLEDGE_FILE_MAX_SIZE_BYTES}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** The questions step: one card per question and answer. */
function FaqContent({
  rows,
  onRowsChange,
  categories,
  onCategoriesChange,
  categoryOptions,
  categoriesLoading,
  showErrors,
  serverErrors,
  onServerErrorsChange,
  error,
}: {
  rows: FaqRow[];
  onRowsChange: (next: FaqRow[]) => void;
  /** The categories every question added here is filed under. */
  categories: number[];
  onCategoriesChange: (next: number[]) => void;
  categoryOptions: KnowledgeCategoryOption[];
  categoriesLoading: boolean;
  showErrors: boolean;
  serverErrors: ServerErrors;
  onServerErrorsChange: (next: ServerErrors) => void;
  error?: string;
}) {
  const update = (localId: string, patch: Partial<FaqRow>) => {
    onRowsChange(
      rows.map((row) => (row.localId === localId ? { ...row, ...patch } : row)),
    );
    // The row changed, so what the server said about it no longer applies.
    if (serverErrors[localId]) {
      onServerErrorsChange(
        Object.fromEntries(
          Object.entries(serverErrors).filter(([id]) => id !== localId),
        ),
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <KnowledgeCategoriesField
        options={categoryOptions}
        isLoading={categoriesLoading}
        value={categories}
        onChange={onCategoriesChange}
        hint="Applies to all the questions below."
      />
      {rows.map((row, index) => {
        const isFilled = Boolean(row.question.trim() || row.answer.trim());
        const serverError = serverErrors[row.localId] ?? null;
        const questionError =
          (showErrors && isFilled && !row.question.trim()
            ? "Question is required"
            : undefined) ??
          firstErrorMessage(
            (serverError as Record<string, unknown> | null)?.question,
          );
        const answerError =
          (showErrors && isFilled && !row.answer.trim()
            ? "Answer is required"
            : undefined) ??
          firstErrorMessage(
            (serverError as Record<string, unknown> | null)?.answer,
          );

        return (
          <div
            key={row.localId}
            className="flex flex-col gap-3 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Question {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove question ${index + 1}`}
                onClick={() => {
                  const next = rows.filter(
                    (entry) => entry.localId !== row.localId,
                  );
                  onRowsChange(next.length > 0 ? next : [emptyFaqRow()]);
                }}
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`faq-question-${row.localId}`}
                className="text-xs font-medium"
              >
                Customer Asks
              </label>
              <Input
                id={`faq-question-${row.localId}`}
                placeholder="e.g. Can I exchange a size after delivery?"
                autoComplete="off"
                value={row.question}
                onChange={(event) =>
                  update(row.localId, { question: event.target.value })
                }
                aria-invalid={Boolean(questionError)}
              />
              {questionError && (
                <p className="text-xs text-destructive">{questionError}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`faq-answer-${row.localId}`}
                className="text-xs font-medium"
              >
                Your Answer
              </label>
              <Textarea
                id={`faq-answer-${row.localId}`}
                className="max-h-96 min-h-20 resize-y"
                placeholder="Write it the way you'd reply to a customer."
                maxLength={FAQ_ANSWER_MAX_LENGTH}
                value={row.answer}
                onChange={(event) =>
                  update(row.localId, { answer: event.target.value })
                }
                aria-invalid={Boolean(answerError)}
              />
              <div className="flex items-center justify-between gap-2">
                {answerError ? (
                  <p className="text-xs text-destructive">{answerError}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted-foreground">
                  {row.answer.length.toLocaleString()} /{" "}
                  {FAQ_ANSWER_MAX_LENGTH.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={rows.length >= KNOWLEDGE_FAQ_CAP}
        onClick={() => onRowsChange([...rows, emptyFaqRow()])}
      >
        <IconPlus className="size-4" />
        Add Another Question
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
