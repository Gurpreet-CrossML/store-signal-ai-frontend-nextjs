"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconArrowLeft,
  IconCircleCheck,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { isValidUrl, normalizeUrl } from "@/lib/url";
import { randomId } from "@/lib/utils";

import {
  AddKnowledgeStepper,
  ContentLayout,
  ExistingKnowledge,
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
import { KnowledgeScopePanel } from "@/components/custom/knowledge/knowledge-scope-panel";
import {
  DEFAULT_KNOWLEDGE_SCOPE,
  scopeToPayload,
  validateScope,
  type KnowledgeScope,
} from "@/components/custom/knowledge/knowledge-scope";
import {
  FAQ_ANSWER_MAX_LENGTH,
  POLICY_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";
import { WebsiteUrlDiscovery } from "@/components/custom/knowledge/website-url-discovery";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  CreateKnowledgeItemsBulk,
  FetchKnowledgeStats,
  type BulkKnowledgeItemContent,
  type DiscoveredPage,
} from "@/redux/api-slice/knowledge-rag-slice";

const FAQ_CAP = 20;
/** Pages and links that can be added in one request (the backend's
 * `KNOWLEDGE_MAX_URLS_PER_REQUEST`). */
const WEBSITE_URL_CAP = 100;
const FILE_CAP = 15;

type ContentSource = Exclude<AddableSource, "article">;

type FaqRow = { localId: string; question: string; answer: string };
/** A link typed in under "Add a link", beside the pages found by the scan. */
type LinkRow = { localId: string; url: string; pageType: string };

const emptyFaqRow = (): FaqRow => ({
  localId: randomId(),
  question: "",
  answer: "",
});

/** A page type the user can tag a link with; it becomes the item's title. */
const LINK_TYPE_OPTIONS = POLICY_TYPE_OPTIONS.filter(
  (option) => option.value !== "generic_link",
);

const TIPS: Record<ContentSource, { title: string; body: string }> = {
  url: {
    title: "Pick pages that answer questions",
    body: "Policies, FAQs, size guides and contact pages work best. Blog posts and job pages rarely help shoppers.",
  },
  file: {
    title: "Scope it tightly",
    body: "A size guide set to Apparel is only used when shoppers ask about apparel. Store-wide documents are checked for every question.",
  },
  faq: {
    title: "Write it like a reply",
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
  const [linkRows, setLinkRows] = useState<LinkRow[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [faqRows, setFaqRows] = useState<FaqRow[]>([emptyFaqRow()]);

  const [showErrors, setShowErrors] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  // Server errors from the last failed submit, one entry per item sent.
  const [serverErrors, setServerErrors] = useState<
    Record<string, unknown>[] | null
  >(null);
  const [added, setAdded] = useState<{ count: number; label: string } | null>(
    null,
  );

  useEffect(() => {
    if (storeCode) dispatch(FetchKnowledgeStats({ storeCode }));
  }, [dispatch, storeCode]);

  const goToLibrary = () => {
    // The library keeps its filters in its URL, so stepping back in history
    // restores the same view; a direct visit has nothing behind it.
    if (window.history.length > 1) router.back();
    else router.push("/knowledge");
  };

  // --- What is ready to add -------------------------------------------------
  const filledFaqs = faqRows.filter(
    (row) => row.question.trim() || row.answer.trim(),
  );
  const completeFaqs = filledFaqs.filter(
    (row) => row.question.trim() && row.answer.trim(),
  );
  const readyCount =
    source === "url"
      ? selectedPageUrls.length + linkRows.length
      : source === "file"
        ? files.length
        : completeFaqs.length;
  const alreadyAdded = discoveredPages.filter(
    (page) => page.alreadyAdded,
  ).length;

  const scopeErrors = validateScope(scope);
  const hasScopeError = Boolean(scopeErrors.aiScope || scopeErrors.selection);
  const hasIncompleteFaq =
    source === "faq" && filledFaqs.length > completeFaqs.length;

  const resetContent = () => {
    setSelectedPageUrls([]);
    setLinkRows([]);
    setFiles([]);
    setFaqRows([emptyFaqRow()]);
    setShowErrors(false);
    setBanner(null);
    setServerErrors(null);
  };

  const handleContinue = () => {
    if (!source) return;
    if (source === "article") {
      router.push("/knowledge/articles/new");
      return;
    }
    setStep("content");
  };

  const handleSubmit = async () => {
    if (!storeCode || !source || source === "article") return;

    setShowErrors(true);
    setBanner(null);
    setServerErrors(null);
    if (readyCount === 0 || hasScopeError || hasIncompleteFaq) return;

    // Which row of the form each submitted item came from, so a server error
    // for item N can be shown on the right row.
    let items: BulkKnowledgeItemContent[] | undefined;
    let itemLabels: string[] = [];

    if (source === "url") {
      const byUrl = new Map(
        discoveredPages.map((page: DiscoveredPage) => [page.url, page]),
      );
      items = [
        ...selectedPageUrls.map((url) => ({
          url,
          title: byUrl.get(url)?.title || undefined,
        })),
        ...linkRows.map((row) => ({
          url: normalizeUrl(row.url),
          title:
            LINK_TYPE_OPTIONS.find((option) => option.value === row.pageType)
              ?.label ?? undefined,
        })),
      ];
      itemLabels = [...selectedPageUrls, ...linkRows.map((row) => row.url)];
    } else if (source === "faq") {
      items = completeFaqs.map((row) => ({
        question: row.question.trim(),
        answer: row.answer.trim(),
      }));
    }

    // Everything but an article goes live as soon as it is added.
    const result = await dispatch(
      CreateKnowledgeItemsBulk({
        storeCode,
        source,
        ...scopeToPayload(scope),
        publish: true,
        ...(source === "file" ? { files } : { items }),
      }),
    );

    if (CreateKnowledgeItemsBulk.fulfilled.match(result)) {
      setAdded({
        count: result.payload.length,
        label:
          source === "url"
            ? plural(result.payload.length, "website page")
            : source === "file"
              ? plural(result.payload.length, "document")
              : plural(result.payload.length, "question"),
      });
      setStep("done");
      dispatch(FetchKnowledgeStats({ storeCode }));
      return;
    }

    const payload = result.payload as
      | { data?: unknown; message?: string }
      | undefined;
    if (Array.isArray(payload?.data)) {
      const errors = payload.data as Record<string, unknown>[];
      setServerErrors(errors);
      const failed = errors.findIndex(
        (entry) => entry && Object.keys(entry).length > 0,
      );
      if (source === "url" && failed >= 0) {
        setBanner(
          `${itemLabels[failed] ? `${itemLabels[failed]}: ` : ""}${
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

  const primaryLabel =
    source === "url"
      ? `Add ${plural(readyCount, "page")}`
      : source === "file"
        ? `Add ${plural(readyCount, "document")}`
        : `Add ${plural(readyCount, "question")}`;
  const footerMessage =
    source === "url"
      ? `${plural(readyCount, "page")} selected${
          alreadyAdded > 0 ? ` · ${alreadyAdded} already in your knowledge` : ""
        }`
      : source === "file"
        ? `${plural(files.length, "file")} ready`
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
          onClick={goToLibrary}
        >
          <IconArrowLeft className="size-4" />
          Knowledge
        </Button>
        <Typography variant="h4" as="h1">
          Add knowledge
        </Typography>
        <Typography variant="muted" className="max-w-2xl">
          Choose what to add. Your assistant answers shoppers from your
          knowledge, plus your Shopify products, which stay synced, and your
          orders, which it reads live.
        </Typography>
      </div>

      <AddKnowledgeStepper step={step} />

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
            <ExistingKnowledge stats={stats} />
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
                defaultUrl={storeUrl}
                selectedPageUrls={selectedPageUrls}
                onSelectedPageUrlsChange={setSelectedPageUrls}
                linkRows={linkRows}
                onLinkRowsChange={setLinkRows}
                pageCap={WEBSITE_URL_CAP}
                error={
                  showErrors && readyCount === 0
                    ? "Select at least one page, or add a link"
                    : undefined
                }
              />
            )}
            {source === "file" && (
              <DocumentsContent
                files={files}
                onFilesChange={setFiles}
                serverErrors={serverErrors}
                error={
                  showErrors && files.length === 0
                    ? "Select at least one file"
                    : undefined
                }
              />
            )}
            {source === "faq" && (
              <FaqContent
                rows={faqRows}
                onRowsChange={setFaqRows}
                showErrors={showErrors}
                serverErrors={serverErrors}
                completeRows={completeFaqs}
                error={
                  showErrors && completeFaqs.length === 0 && !hasIncompleteFaq
                    ? "Add at least one question and answer"
                    : undefined
                }
              />
            )}
          </ContentLayout>

          <StepFooter message={footerMessage}>
            <Button type="button" variant="ghost" onClick={goToLibrary}>
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
              disabled={readyCount === 0}
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
            {added.label} added
          </Typography>
          <Typography variant="muted">
            {source === "faq"
              ? "Your assistant can use them straight away."
              : "We're reading them now. Each one goes live in your assistant as soon as it's ready, and you can follow its progress in Knowledge."}
          </Typography>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/knowledge">View in Knowledge</Link>
            </Button>
            <Button type="button" variant="outline" onClick={startAgain}>
              Add more
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The website step: pages found by scanning the site, plus links typed in. */
function WebsiteContent({
  storeCode,
  defaultUrl,
  selectedPageUrls,
  onSelectedPageUrlsChange,
  linkRows,
  onLinkRowsChange,
  pageCap,
  error,
}: {
  storeCode: string | null | undefined;
  defaultUrl: string;
  selectedPageUrls: string[];
  onSelectedPageUrlsChange: (next: string[]) => void;
  linkRows: LinkRow[];
  onLinkRowsChange: (next: LinkRow[]) => void;
  pageCap: number;
  error?: string;
}) {
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const addLink = () => {
    const value = linkInput.trim();
    if (!value) return;
    if (!isValidUrl(value)) {
      setLinkError(
        "Enter a valid page address, e.g. https://store.com/pages/faq",
      );
      return;
    }
    const url = normalizeUrl(value);
    if (
      linkRows.some((row) => normalizeUrl(row.url) === url) ||
      selectedPageUrls.includes(url)
    ) {
      setLinkError("This page is already in your list");
      return;
    }
    if (selectedPageUrls.length + linkRows.length >= pageCap) {
      setLinkError(`You can add up to ${pageCap} pages at a time`);
      return;
    }
    setLinkError(null);
    setLinkInput("");
    onLinkRowsChange([...linkRows, { localId: randomId(), url, pageType: "" }]);
  };

  return (
    <div className="flex flex-col gap-5">
      <WebsiteUrlDiscovery
        storeCode={storeCode}
        defaultUrl={defaultUrl}
        selectedUrls={selectedPageUrls}
        onSelectedUrlsChange={onSelectedPageUrlsChange}
        maxSelection={pageCap}
        error={error}
      />

      <section className="flex flex-col gap-2 border-t pt-4">
        <h3 className="text-sm font-semibold">Add a link</h3>
        <div className="flex gap-2">
          <Input
            placeholder="https://store.com/pages/…"
            autoComplete="off"
            aria-label="Page address"
            value={linkInput}
            onChange={(event) => setLinkInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addLink();
              }
            }}
            aria-invalid={Boolean(linkError)}
          />
          <Button type="button" variant="outline" onClick={addLink}>
            Add
          </Button>
        </div>
        {linkError && <p className="text-xs text-destructive">{linkError}</p>}

        {linkRows.length > 0 && (
          <ul className="flex flex-col divide-y rounded-lg border">
            {linkRows.map((row) => (
              <li
                key={row.localId}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5"
              >
                <p
                  className="min-w-0 flex-1 basis-48 truncate text-sm"
                  title={row.url}
                >
                  {row.url}
                </p>
                <Select
                  value={row.pageType || undefined}
                  onValueChange={(pageType) =>
                    onLinkRowsChange(
                      linkRows.map((entry) =>
                        entry.localId === row.localId
                          ? { ...entry, pageType }
                          : entry,
                      ),
                    )
                  }
                >
                  <SelectTrigger size="sm" className="w-44">
                    <SelectValue placeholder="Page type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${row.url}`}
                  onClick={() =>
                    onLinkRowsChange(
                      linkRows.filter((entry) => entry.localId !== row.localId),
                    )
                  }
                >
                  <IconX className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          One page per link. If a page changes later, use &quot;Read the page
          again&quot; in Knowledge.
        </p>
      </section>
    </div>
  );
}

/** The documents step: the drop area and the files chosen so far. */
function DocumentsContent({
  files,
  onFilesChange,
  serverErrors,
  error,
}: {
  files: File[];
  onFilesChange: (next: File[]) => void;
  serverErrors: Record<string, unknown>[] | null;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <MultiFileUploadDropzone
        files={files}
        onFilesSelected={(selected) =>
          onFilesChange([...files, ...selected].slice(0, FILE_CAP))
        }
        onRemoveFile={(index) =>
          onFilesChange(files.filter((_, i) => i !== index))
        }
        errors={files.map(
          (_, index) =>
            (serverErrors?.[index] && firstErrorMessage(serverErrors[index])) ||
            undefined,
        )}
        maxFiles={FILE_CAP}
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
  showErrors,
  serverErrors,
  completeRows,
  error,
}: {
  rows: FaqRow[];
  onRowsChange: (next: FaqRow[]) => void;
  showErrors: boolean;
  serverErrors: Record<string, unknown>[] | null;
  /** The rows that are filled in, in the order they are sent. */
  completeRows: FaqRow[];
  error?: string;
}) {
  const update = (localId: string, patch: Partial<FaqRow>) =>
    onRowsChange(
      rows.map((row) => (row.localId === localId ? { ...row, ...patch } : row)),
    );

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, index) => {
        const isFilled = Boolean(row.question.trim() || row.answer.trim());
        // The server only saw the complete rows, so map its errors back.
        const sentIndex = completeRows.findIndex(
          (entry) => entry.localId === row.localId,
        );
        const serverError = sentIndex >= 0 ? serverErrors?.[sentIndex] : null;
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
                Customer asks
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
                Your answer
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
        disabled={rows.length >= FAQ_CAP}
        onClick={() => onRowsChange([...rows, emptyFaqRow()])}
      >
        <IconPlus className="size-4" />
        Add another question
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
