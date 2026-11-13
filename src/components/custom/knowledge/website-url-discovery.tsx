"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconExternalLink,
  IconRefresh,
  IconSearch,
  IconWorldSearch,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isValidWebsiteUrl, normalizeUrl } from "@/lib/url";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  DiscoverWebsiteUrls,
  FetchDiscoveredPageDetails,
  ResetDiscoverWebsiteUrls,
  type DiscoveredPage,
} from "@/redux/api-slice/knowledge-rag-slice";

/** The path + query of a page URL (e.g. `/pages/shipping`), which is easier
 * to scan in a table than the full address. */
export function pageEndpoint(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname || "/"}${parsed.search}`;
  } catch {
    return url;
  }
}

/** `example.com` for `https://www.example.com/a`; empty when it isn't an address. */
function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Pages never selectable: ones the store already has (the backend rejects a
 * whole batch containing a duplicate) and ones with too little content. */
function isDisabledPage(page: DiscoveredPage): boolean {
  return page.alreadyAdded || !page.hasEnoughContent;
}

// Sites rate-limit bursts, so a scan can't read every page's details in one
// go (see `FetchDiscoveredPageDetails`). The rest are filled in afterwards,
// a small batch at a time, pausing when the site says it is throttling.
const DETAILS_BATCH_SIZE = 20;
const DETAILS_BATCH_GAP_MS = 1_000;
const DETAILS_THROTTLE_WAIT_MS = 30_000;
/** Tries per page that comes back still unreadable without being throttled. */
const DETAILS_MAX_ATTEMPTS = 3;
/** Throttled rounds (~30s each) to sit through before giving up. */
const DETAILS_MAX_THROTTLED_ROUNDS = 6;

type WebsiteUrlDiscoveryProps = {
  storeCode: string | null | undefined;
  /** URLs of the pages the user has ticked. */
  selectedUrls: string[];
  onSelectedUrlsChange: (next: string[]) => void;
  /** The most pages that can be indexed in one request. */
  maxSelection: number;
  error?: string;
  /** The site to scan as soon as this opens (the store's own); it can be changed. */
  defaultUrl?: string;
};

export function WebsiteUrlDiscovery({
  storeCode,
  selectedUrls,
  onSelectedUrlsChange,
  maxSelection,
  error,
  defaultUrl = "",
}: WebsiteUrlDiscoveryProps) {
  const dispatch = useAppDispatch();
  const {
    DiscoverWebsiteUrlsIsLoading: isLoading,
    DiscoverWebsiteUrlsIsSuccess: hasScanned,
    DiscoverWebsiteUrlsIsError: scanError,
    DiscoverWebsiteUrlsListData: pages,
    DiscoverWebsiteUrlsTruncated: truncated,
    DiscoverWebsiteUrlsMinWords: minWords,
    DiscoverWebsiteUrlsWebsiteUrl: scannedUrl,
    DiscoverWebsiteUrlsThrottled: throttled,
    DiscoverWebsiteUrlsDetailsIsLoading: detailsLoading,
  } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.DiscoverWebsiteUrlsState,
  );

  // This view unmounts when the user switches to "Enter URLs", changes the
  // source, or leaves the page. A scan still running then has nobody waiting
  // for it, so cancel it rather than let its result land in a view that is
  // gone (or reappear stale later). Aborting a finished request is a no-op.
  const scanRequest = useRef<{ abort: () => void } | null>(null);
  const detailsRequest = useRef<{ abort: () => void } | null>(null);
  // It also clears the stored scan results, so coming back starts empty.
  useEffect(
    () => () => {
      scanRequest.current?.abort();
      detailsRequest.current?.abort();
      dispatch(ResetDiscoverWebsiteUrls());
    },
    [dispatch],
  );

  // Per-page tries at reading details, and how many throttled rounds we've
  // sat through, so the background loading below always ends.
  const [detailAttempts, setDetailAttempts] = useState<Record<string, number>>(
    {},
  );
  const [throttledRounds, setThrottledRounds] = useState(0);

  const [websiteUrl, setWebsiteUrl] = useState(defaultUrl);
  // The address box is hidden while the default site is being used.
  const [changingSite, setChangingSite] = useState(!defaultUrl);
  const [inputError, setInputError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const selected = useMemo(() => new Set(selectedUrls), [selectedUrls]);

  // Pages whose title/word count we still want to read.
  const loadingDetailsFor = pages.filter(
    (page) =>
      page.wordCount === null &&
      (detailAttempts[page.url] ?? 0) < DETAILS_MAX_ATTEMPTS,
  );
  const stillLoadingDetails =
    loadingDetailsFor.length > 0 &&
    throttledRounds < DETAILS_MAX_THROTTLED_ROUNDS;

  useEffect(() => {
    if (!storeCode || !scannedUrl || isLoading || detailsLoading) return;
    if (!stillLoadingDetails) return;

    const batch = loadingDetailsFor.slice(0, DETAILS_BATCH_SIZE);
    const timer = setTimeout(
      async () => {
        const request = dispatch(
          FetchDiscoveredPageDetails({
            storeCode,
            websiteUrl: scannedUrl,
            urls: batch.map((page) => page.url),
          }),
        );
        detailsRequest.current = request;
        const result = await request;

        if (!FetchDiscoveredPageDetails.fulfilled.match(result)) {
          // A failed batch (cancelled ones aside) counts toward giving up, so
          // a broken backend isn't retried forever.
          if (!result.meta.aborted) setThrottledRounds((rounds) => rounds + 1);
          return;
        }
        if (result.payload.throttled) {
          setThrottledRounds((rounds) => rounds + 1);
        } else {
          // Not throttled, so a page still unreadable here is a real failure:
          // count the try so we don't ask for it forever.
          setDetailAttempts((attempts) => {
            const next = { ...attempts };
            for (const page of batch)
              next[page.url] = (next[page.url] ?? 0) + 1;
            return next;
          });
        }
      },
      throttled ? DETAILS_THROTTLE_WAIT_MS : DETAILS_BATCH_GAP_MS,
    );
    return () => clearTimeout(timer);
    // `loadingDetailsFor` is derived from `pages` (+ a ref), so `pages` covers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pages,
    throttled,
    throttledRounds,
    detailAttempts,
    isLoading,
    detailsLoading,
    storeCode,
    scannedUrl,
    dispatch,
  ]);

  // A page that turns out to be gone, thin, or already added can't stay ticked.
  useEffect(() => {
    const allowed = new Set(
      pages.filter((page) => !isDisabledPage(page)).map((page) => page.url),
    );
    if (selectedUrls.some((url) => !allowed.has(url))) {
      onSelectedUrlsChange(selectedUrls.filter((url) => allowed.has(url)));
    }
  }, [pages, selectedUrls, onSelectedUrlsChange]);

  // Only pages we've actually read are listed: one whose title/word count
  // couldn't be read (yet) stays out of the table instead of showing blanks.
  const readablePages = useMemo(
    () => pages.filter((page) => page.wordCount !== null),
    [pages],
  );

  const visiblePages = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return readablePages;
    return readablePages.filter(
      (page) =>
        page.title.toLowerCase().includes(query) ||
        pageEndpoint(page.url).toLowerCase().includes(query),
    );
  }, [readablePages, filter]);

  const atCap = selectedUrls.length >= maxSelection;

  /** Why a page's checkbox is disabled (shown on hover), or null if it isn't. */
  const disabledReason = (
    page: DiscoveredPage,
    isSelected: boolean,
  ): string | null => {
    if (page.alreadyAdded) return "Already added to your knowledge base";
    if (!page.hasEnoughContent)
      return `Not enough content to index (fewer than ${minWords} words)`;
    if (!isSelected && atCap)
      return `You can select up to ${maxSelection} pages at a time`;
    return null;
  };
  const selectablePages = visiblePages.filter((page) => !isDisabledPage(page));
  // Checked while the selection is "full": every selectable page shown is
  // ticked, or the cap was reached (so it still reads as checked when the
  // site has more pages than we allow).
  const allSelected =
    selectedUrls.length > 0 &&
    (atCap || selectablePages.every((page) => selected.has(page.url)));

  // No new scan while one is running or while the previous scan's remaining
  // page details are still loading (it would throw that work away).
  const busy = isLoading || detailsLoading || stillLoadingDetails;

  const scan = async (url = websiteUrl) => {
    if (!storeCode || busy) return;
    if (!url.trim()) {
      setInputError("Enter your website URL");
      return;
    }
    if (!isValidWebsiteUrl(url)) {
      setInputError("Enter a valid website URL, e.g. https://company.com");
      return;
    }
    setInputError(null);
    setFilter("");
    onSelectedUrlsChange([]);
    detailsRequest.current?.abort();
    setDetailAttempts({});
    setThrottledRounds(0);
    const request = dispatch(
      DiscoverWebsiteUrls({
        storeCode,
        websiteUrl: normalizeUrl(url),
      }),
    );
    scanRequest.current = request;
    await request;
    if (scanRequest.current === request) scanRequest.current = null;
    setChangingSite(false);
  };

  // Scan the default site as soon as the view opens, once.
  const autoScanned = useRef(false);
  useEffect(() => {
    if (autoScanned.current || !storeCode || !defaultUrl) return;
    autoScanned.current = true;
    void scan(defaultUrl);
    // Runs once, with whatever the store and default address are by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCode, defaultUrl]);

  const togglePage = (page: DiscoveredPage, checked: boolean) => {
    if (checked) {
      if (isDisabledPage(page) || selected.has(page.url) || atCap) return;
      onSelectedUrlsChange([...selectedUrls, page.url]);
    } else {
      onSelectedUrlsChange(selectedUrls.filter((url) => url !== page.url));
    }
  };

  // Ticking selects pages up to the cap; unticking clears the whole selection.
  const toggleAll = (checked: boolean) => {
    if (!checked) {
      onSelectedUrlsChange([]);
      return;
    }
    const room = Math.max(maxSelection - selectedUrls.length, 0);
    const additions = selectablePages
      .filter((page) => !selected.has(page.url))
      .slice(0, room)
      .map((page) => page.url);
    onSelectedUrlsChange([...selectedUrls, ...additions]);
  };

  const shownError = inputError ?? scanError;
  const scannedHost = hostOf(scannedUrl || websiteUrl);
  const newPages = selectablePages.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm font-semibold">
          {scannedHost ? `Found on ${scannedHost}` : "Scan a website"}
        </p>
        <div className="flex items-center gap-1">
          {!changingSite && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => setChangingSite(true)}
            >
              Change site
            </Button>
          )}
          {scannedUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary"
              disabled={busy}
              onClick={() => void scan(scannedUrl)}
            >
              <IconRefresh className="size-4" />
              Scan again
            </Button>
          )}
        </div>
      </div>

      {changingSite && (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="https://company.com"
              autoComplete="off"
              aria-label="Website to scan"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void scan();
                }
              }}
              aria-invalid={Boolean(shownError)}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={busy || !storeCode}
              onClick={() => void scan()}
            >
              {isLoading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Scanning…
                </>
              ) : (
                <>
                  <IconWorldSearch className="size-4" />
                  Scan website
                </>
              )}
            </Button>
          </div>
          {!shownError && (
            <p className="text-xs text-muted-foreground">
              We&apos;ll find the pages on this site so you can choose which
              ones to add.
            </p>
          )}
        </div>
      )}
      {shownError && <p className="text-xs text-destructive">{shownError}</p>}

      {isLoading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Looking for pages on {scannedHost || "your site"}…
        </p>
      )}

      {!isLoading && hasScanned && pages.length === 0 && (
        <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
          No pages were found on this website.
        </p>
      )}

      {!isLoading && readablePages.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Filter by title or address…"
              autoComplete="off"
              aria-label="Filter pages"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 font-medium">
              <Checkbox
                aria-label={
                  allSelected ? "Unselect all pages" : "Select all new pages"
                }
                checked={
                  allSelected
                    ? true
                    : selectedUrls.length > 0 && "indeterminate"
                }
                disabled={newPages === 0}
                onCheckedChange={(checked) => toggleAll(checked === true)}
              />
              Select all new pages
            </label>
            <span className="text-xs text-muted-foreground">
              {selectedUrls.length} of {newPages} selected
            </span>
          </div>

          {/* One scroll area, so a long list never pushes the rest off screen. */}
          <ul className="max-h-[28rem] divide-y overflow-auto rounded-lg border">
            {visiblePages.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No pages match your filter.
              </li>
            )}
            {visiblePages.map((page) => {
              const isSelected = selected.has(page.url);
              const reason = disabledReason(page, isSelected);
              return (
                <li
                  key={page.url}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5",
                    isDisabledPage(page) && "bg-muted/30",
                  )}
                >
                  {reason ? (
                    // A disabled checkbox swallows hover, so the tooltip
                    // hangs off a wrapper and the checkbox lets events through.
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-not-allowed">
                          <Checkbox
                            className="pointer-events-none"
                            aria-label={`Can't select ${page.title || page.url}: ${reason}`}
                            checked={isSelected || page.alreadyAdded}
                            disabled
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right">{reason}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Checkbox
                      aria-label={`Select ${page.title || page.url}`}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        togglePage(page, checked === true)
                      }
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                      <span className="truncate">
                        {page.title || pageEndpoint(page.url)}
                      </span>
                      {page.alreadyAdded ? (
                        <Badge variant="secondary" className="font-normal">
                          Already added
                        </Badge>
                      ) : (
                        !page.hasEnoughContent && (
                          <Badge
                            variant="secondary"
                            className="font-normal"
                            title={`Fewer than ${minWords} words — not enough content to index`}
                          >
                            Not enough content
                          </Badge>
                        )
                      )}
                    </p>
                    <p
                      className="truncate text-xs text-muted-foreground"
                      title={page.url}
                    >
                      {hostOf(page.url)}
                      {pageEndpoint(page.url)}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:inline">
                    {(page.wordCount ?? 0).toLocaleString()} words
                  </span>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${page.title || page.url} in a new tab`}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <IconExternalLink className="size-4" />
                  </a>
                </li>
              );
            })}
          </ul>

          {truncated && (
            <p className="text-xs text-muted-foreground">
              This site has more pages than we scan at once, so only the first{" "}
              {pages.length} were scanned.
            </p>
          )}
        </div>
      )}

      {!isLoading && stillLoadingDetails && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3" />
          Loading details for {loadingDetailsFor.length} more page
          {loadingDetailsFor.length === 1 ? "" : "s"}
          {throttled
            ? " — the website limits how fast it can be read, so this may take a minute."
            : "…"}
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
