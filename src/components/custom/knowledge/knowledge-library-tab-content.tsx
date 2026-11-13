"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconMessage2,
  IconPlus,
  IconSearch,
  IconSend,
  IconX,
  IconRefresh,
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
import { PageHeading } from "@/components/custom/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import {
  DeleteKnowledgeItem,
  DeleteKnowledgeItems,
  FetchKnowledgeItems,
  FetchKnowledgeStats,
  PublishKnowledgeItems,
  UpdateKnowledgeItemsScope,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  KnowledgeFilterPopover,
  countActiveKnowledgeFilters,
  type KnowledgeFilterSelection,
} from "@/components/custom/knowledge/knowledge-filters";
import { KnowledgeStorageCard } from "@/components/custom/knowledge/knowledge-storage-card";
import { KnowledgeEmptyState } from "@/components/custom/knowledge/knowledge-empty-state";
import {
  isKnowledgeItemSelectable,
  KnowledgeList,
} from "@/components/custom/knowledge/knowledge-list";
import { BulkAssistantsPopover } from "@/components/custom/knowledge/bulk-assistants-popover";
import { KnowledgeDataTablePagination } from "@/components/custom/knowledge/knowledge-data-table-pagination";
import { PAGE_SIZE_OPTIONS } from "@/components/custom/threads-data-table-pagination";
import {
  AI_SCOPE_META,
  isKnowledgeItemEditable,
  KNOWLEDGE_STATUS_META,
  KNOWLEDGE_TYPE_META,
} from "@/components/custom/knowledge/knowledge-meta";
import type {
  AIScope,
  KnowledgeCounts,
  KnowledgeSource,
  KnowledgeStatus,
  KnowledgeType,
} from "@/redux/api-slice/knowledge-rag-slice";

const DEFAULT_PAGE_SIZE = 25;

// Source tabs above the list; each maps to the `source` API filter.
const SOURCE_TABS: {
  value: KnowledgeSource | "all";
  label: string;
  /** Which of the stats endpoint's counts this tab shows. */
  countKey: keyof KnowledgeCounts;
}[] = [
  { value: "all", label: "All", countKey: "knowledge_items" },
  { value: "article", label: "Articles", countKey: "articles" },
  { value: "file", label: "Documents", countKey: "documents" },
  { value: "url", label: "Website pages", countKey: "urls" },
  { value: "faq", label: "Q&A", countKey: "faqs" },
];

/** The values of a comma-separated URL param. */
function splitParam(value: string) {
  return value.split(",").filter(Boolean);
}

export default function KnowledgeLibraryTabContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const canEditKnowledge = useCan("knowledge", { write: true });
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchKnowledgeItemsListData, FetchKnowledgeItemsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchKnowledgeItemsState,
    );
  const { FetchKnowledgeStatsData: stats } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeStatsState,
  );
  const { DeleteKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.DeleteKnowledgeItemState,
  );

  // All list filters live in the URL (?q=&type=&source=&status=&page=&pageSize=)
  // so a reload, back/forward or a shared link restores the same view.
  const pathname = usePathname() ?? "/knowledge";
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams?.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSizeParam = Number(searchParams?.get("pageSize"));
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam)
    ? pageSizeParam
    : DEFAULT_PAGE_SIZE;
  const debouncedSearch = (searchParams?.get("q") ?? "").trim();
  const sourceParam = searchParams?.get("source") ?? "";
  // The multi-value filters are comma-separated in the URL; the raw strings
  // are what the list reloads on, since the arrays are new on every render.
  const typeParam = searchParams?.get("type") ?? "";
  const statusParam = searchParams?.get("status") ?? "";
  const aiScopeParam = searchParams?.get("ai_scope") ?? "";
  const createdByParam = searchParams?.get("created_by") ?? "";
  const filters: KnowledgeFilterSelection = {
    source: (["file", "url", "faq", "article"].includes(sourceParam)
      ? sourceParam
      : "") as KnowledgeSource | "",
    status: splitParam(statusParam).filter(
      (value): value is KnowledgeStatus => value in KNOWLEDGE_STATUS_META,
    ),
    aiScope: splitParam(aiScopeParam).filter(
      (value): value is AIScope => value in AI_SCOPE_META,
    ),
    type: splitParam(typeParam).filter(
      (value): value is KnowledgeType => value in KNOWLEDGE_TYPE_META,
    ),
    createdBy: splitParam(createdByParam),
  };

  // Rows ticked for a bulk action, by id. Only ids on the current page count
  // (see `selectedItems`), and it is emptied whenever the URL params change.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  // Drafts waiting on the publish confirmation; empty when it is closed.
  const [publishTargets, setPublishTargets] = useState<KnowledgeItem[]>([]);

  const updateParams = useCallback(
    (changes: Record<string, string | number | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const query = next.toString();
      // A different page, filter or tab shows different rows.
      setSelectedIds(new Set());
      // Native history API instead of router.replace: Next syncs it into
      // useSearchParams without an RSC round-trip to the server, which is
      // what stalled the tab switch on production after a reload with
      // ?source= in the URL.
      window.history.replaceState(
        null,
        "",
        query ? `${pathname}?${query}` : pathname,
      );
    },
    [pathname, searchParams, setSelectedIds],
  );

  const [searchInput, setSearchInput] = useState(debouncedSearch);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);

  const items = FetchKnowledgeItemsListData.results;
  const selectedItems = items.filter(
    (item) => selectedIds.has(item.id) && isKnowledgeItemSelectable(item),
  );
  const selectedDrafts = selectedItems.filter(
    (item) => item.status === "draft",
  );
  const totalCount = FetchKnowledgeItemsListData.count;
  const activeFilterCount = countActiveKnowledgeFilters(filters);
  const hasFilters =
    activeFilterCount > 0 || filters.source !== "" || debouncedSearch !== "";
  const hasClearableFilters = activeFilterCount > 0 || debouncedSearch !== "";
  const applyFilters = (next: KnowledgeFilterSelection) =>
    updateParams({
      status: next.status.join(","),
      ai_scope: next.aiScope.join(","),
      type: next.type.join(","),
      created_by: next.createdBy.join(","),
      page: null,
    });
  // No knowledge exists yet (not just filtered down to nothing) — show only
  // the centered "Add Knowledge" button from the empty state below, not the
  // search/filter toolbar.
  const isEmptyLibrary =
    !FetchKnowledgeItemsIsLoading && !hasFilters && totalCount === 0;

  // Debounce so a request isn't fired per keystroke; the settled value is
  // written to the URL, which is the source of truth for the fetch.
  useEffect(() => {
    const next = searchInput.trim();
    if (next === debouncedSearch) return;
    const timer = setTimeout(() => updateParams({ q: next, page: null }), 350);
    return () => clearTimeout(timer);
  }, [searchInput, debouncedSearch, updateParams]);

  const loadItems = () => {
    if (!storeCode) return;
    dispatch(
      FetchKnowledgeItems({
        storeCode,
        page,
        pageSize,
        search: debouncedSearch,
        source: filters.source || undefined,
        status: filters.status,
        aiScope: filters.aiScope,
        type: filters.type,
        createdBy: filters.createdBy,
      }),
    );
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    storeCode,
    page,
    pageSize,
    debouncedSearch,
    filters.source,
    typeParam,
    statusParam,
    aiScopeParam,
    createdByParam,
  ]);

  const loadStats = useCallback(() => {
    if (storeCode) dispatch(FetchKnowledgeStats({ storeCode }));
  }, [dispatch, storeCode]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Each item opens on its own page; an article opens in its editor.
  const handleOpenItem = (item: KnowledgeItem) => {
    router.push(
      item.source === "article"
        ? `/knowledge/articles/${item.id}`
        : `/knowledge/items/${item.id}`,
    );
  };

  // Editing happens on the item's own page: an article in its editor, the
  // rest on the view page switched to edit mode.
  const handleEditItem = (item: KnowledgeItem) => {
    if (!isKnowledgeItemEditable(item.status)) return;
    router.push(
      item.source === "article"
        ? `/knowledge/articles/${item.id}`
        : `/knowledge/items/${item.id}?edit=1`,
    );
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const result = await dispatch(
      DeleteKnowledgeItem({ id: itemToDelete.id, storeCode }),
    );
    if (DeleteKnowledgeItem.fulfilled.match(result)) {
      setItemToDelete(null);
      loadItems();
      loadStats();
    }
  };

  const handleToggleItem = (item: KnowledgeItem) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (!next.delete(item.id)) next.add(item.id);
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedIds(
      new Set(
        checked
          ? items.filter(isKnowledgeItemSelectable).map((item) => item.id)
          : [],
      ),
    );
  };

  /** Replaces the assistants on the selected items; resolves `true` once saved. */
  const handleChangeScope = async (aiScope: AIScope[]) => {
    const result = await dispatch(
      UpdateKnowledgeItemsScope({
        ids: selectedItems.map((item) => item.id),
        aiScope,
        storeCode,
      }),
    );
    if (!UpdateKnowledgeItemsScope.fulfilled.match(result)) return false;

    setSelectedIds(new Set());
    loadItems();
    return true;
  };

  // Open the publish confirmation. Only drafts can be published, so anything
  // else in `targets` is left out.
  const requestPublish = (targets: KnowledgeItem[]) => {
    setPublishTargets(targets.filter((item) => item.status === "draft"));
  };

  const handlePublish = async (targets: KnowledgeItem[]) => {
    const ids = targets
      .filter((item) => item.status === "draft")
      .map((item) => item.id);
    if (ids.length === 0) return;

    setIsPublishing(true);
    const result = await dispatch(PublishKnowledgeItems({ ids, storeCode }));
    setIsPublishing(false);

    if (PublishKnowledgeItems.fulfilled.match(result)) {
      // Whatever was published leaves the selection; the rest stays to retry.
      const published = new Set(result.payload.publishedIds);
      setSelectedIds(
        (previous) => new Set([...previous].filter((id) => !published.has(id))),
      );
      loadItems();
    }
  };

  const handleConfirmPublish = async () => {
    await handlePublish(publishTargets);
    setPublishTargets([]);
  };

  const handleConfirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    const result = await dispatch(
      DeleteKnowledgeItems({
        ids: selectedItems.map((item) => item.id),
        storeCode,
      }),
    );
    setIsBulkDeleting(false);

    if (DeleteKnowledgeItems.fulfilled.match(result)) {
      // Whatever could not be deleted stays selected, to retry.
      setSelectedIds(new Set(result.payload.failedIds));
      setBulkDeleteOpen(false);
      loadItems();
      loadStats();
    }
  };

  // Products take up storage even before any knowledge is added, so an empty
  // library still shows the card once something is used.
  const showStorage = stats
    ? !isEmptyLibrary || stats.vector_storage.total > 0
    : !isEmptyLibrary;

  const headingActions = (
    <div className="flex items-center gap-2">
      {/* Placeholder: not wired to anything yet. */}
      {!isEmptyLibrary && (
        <Button type="button" variant="outline" size="sm">
          <IconMessage2 className="size-4" />
          <span className="sm:hidden">Test</span>
          <span className="max-sm:hidden">Test your AI</span>
        </Button>
      )}
      {canEditKnowledge && (
        <Button size="sm" asChild>
          <Link href="/knowledge/new">
            <IconPlus className="size-4" />
            <span className="sm:hidden">Add</span>
            <span className="max-sm:hidden">Add knowledge</span>
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title="Knowledge"
        description="What your AI knows about your store. It answers shoppers using what you add here, plus your Shopify products and orders."
        action={headingActions}
        // On a phone the buttons stay on the title's row and the description
        // is left out; the empty library also sits under a rule.
        className={cn(
          "max-sm:flex-row max-sm:items-center max-sm:justify-between",
          isEmptyLibrary &&
            "max-sm:-mx-4 max-sm:-mt-4 max-sm:border-b max-sm:p-4",
        )}
        descriptionClassName="max-sm:hidden"
      />
      <div className="flex w-full flex-col gap-4">
        {showStorage && (
          <KnowledgeStorageCard storage={stats?.vector_storage ?? null} />
        )}
        {!isEmptyLibrary && (
          <Tabs
            value={filters.source || "all"}
            onValueChange={(value) =>
              updateParams({
                source: value === "all" ? null : value,
                page: null,
              })
            }
          >
            {/* Scrolls sideways when the tabs don't fit (a phone). The padding
                keeps the active tab's underline, which hangs below the
                trigger, from being clipped by the scroll container. */}
            <div className="overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList
                variant="line"
                className="h-10 w-max min-w-full justify-start"
              >
                {SOURCE_TABS.map(({ value, label, countKey }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="group/tab flex-none px-3 data-active:font-semibold data-active:text-primary data-active:after:bg-primary dark:data-active:text-primary"
                  >
                    {label}
                    {stats && (
                      <span className="rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground group-data-active/tab:bg-primary/10 group-data-active/tab:text-primary">
                        {stats.counts[countKey]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        )}
        {!isEmptyLibrary && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by titles, links and answers"
                className="pl-8"
                aria-label="Search knowledge"
              />
            </div>

            <KnowledgeFilterPopover
              filters={filters}
              creators={stats?.creators ?? []}
              onFiltersChange={applyFilters}
            />

            {hasClearableFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground max-sm:hidden"
                onClick={() => {
                  setSearchInput("");
                  updateParams({
                    q: null,
                    status: null,
                    ai_scope: null,
                    type: null,
                    created_by: null,
                    page: null,
                  });
                }}
              >
                <IconX />
                Clear
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="ml-auto max-sm:hidden"
              onClick={loadItems}
              disabled={FetchKnowledgeItemsIsLoading}
              aria-label="Refresh knowledge list"
              title="Refresh"
            >
              {FetchKnowledgeItemsIsLoading ? (
                <Spinner className="size-4" />
              ) : (
                <IconRefresh className="size-4" />
              )}
            </Button>

            <span className="text-sm text-muted-foreground max-sm:hidden">
              {items.length} of {totalCount} items
            </span>
          </div>
        )}

        {isEmptyLibrary && canEditKnowledge ? (
          <>
            <KnowledgeEmptyState />
          </>
        ) : (
          <>
            {selectedItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedItems.length} selected
                </span>
                {selectedDrafts.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPublishing}
                    title="Only drafts are published"
                    onClick={() => requestPublish(selectedDrafts)}
                  >
                    {isPublishing ? (
                      <Spinner className="size-4" />
                    ) : (
                      <IconSend className="size-4" />
                    )}
                    {selectedDrafts.length === selectedItems.length
                      ? "Publish"
                      : `Publish ${selectedDrafts.length} ${selectedDrafts.length === 1 ? "draft" : "drafts"}`}
                  </Button>
                )}
                <BulkAssistantsPopover
                  count={selectedItems.length}
                  onApply={handleChangeScope}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  Delete
                </Button>
              </div>
            )}

            <KnowledgeList
              items={items}
              isLoading={FetchKnowledgeItemsIsLoading}
              onOpenItem={handleOpenItem}
              onEditItem={handleEditItem}
              onPublish={(item) => requestPublish([item])}
              onDelete={(item) => setItemToDelete(item)}
              hasFilters={hasFilters}
              canEdit={canEditKnowledge}
              selectedIds={selectedIds}
              onToggleItem={handleToggleItem}
              onToggleAll={handleToggleAll}
            />

            <KnowledgeDataTablePagination
              items={items}
              totalCount={totalCount}
              pageSize={pageSize}
              page={page}
              onPaginationChange={(next) => {
                updateParams({
                  page: next.page === 1 ? null : next.page,
                  pageSize:
                    next.pageSize === DEFAULT_PAGE_SIZE ? null : next.pageSize,
                });
              }}
            />
          </>
        )}

        <AlertDialog
          open={itemToDelete !== null}
          onOpenChange={(open) => {
            if (!open) setItemToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this knowledge?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove &quot;{itemToDelete?.title}&quot;.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={DeleteKnowledgeItemIsLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={DeleteKnowledgeItemIsLoading}
                onClick={(event) => {
                  event.preventDefault();
                  handleConfirmDelete();
                }}
              >
                {DeleteKnowledgeItemIsLoading ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={publishTargets.length > 0}
          onOpenChange={(open) => {
            if (!open && !isPublishing) setPublishTargets([]);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {publishTargets.length === 1
                  ? "Publish this knowledge?"
                  : `Publish ${publishTargets.length} knowledge items?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {publishTargets.length === 1
                  ? `"${publishTargets[0].title}" will be processed and added to what your AI knows.`
                  : "They will be processed and added to what your AI knows."}{" "}
                This uses your vector storage.
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
                  handleConfirmPublish();
                }}
              >
                {isPublishing ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Publishing...
                  </>
                ) : (
                  "Publish"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedItems.length} knowledge{" "}
                {selectedItems.length === 1 ? "item" : "items"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the selected knowledge. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBulkDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={isBulkDeleting}
                onClick={(event) => {
                  event.preventDefault();
                  handleConfirmBulkDelete();
                }}
              >
                {isBulkDeleting ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
