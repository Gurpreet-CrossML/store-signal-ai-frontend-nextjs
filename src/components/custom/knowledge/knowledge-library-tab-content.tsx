"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
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
import {
  KNOWLEDGE_ALL_DESCRIPTION,
  KNOWLEDGE_ALL_NAME,
  KNOWLEDGE_ALL_ROUTE,
  KNOWLEDGE_APPROVAL_WAITING_DESCRIPTION,
  KNOWLEDGE_APPROVAL_WAITING_NAME,
  KNOWLEDGE_APPROVAL_WAITING_PARAM,
  KNOWLEDGE_UNCATEGORIZED_DESCRIPTION,
  KNOWLEDGE_UNCATEGORIZED_FILTER,
  KNOWLEDGE_UNCATEGORIZED_NAME,
  KNOWLEDGE_UNCATEGORIZED_ROUTE,
} from "@/lib/config";
import {
  DeleteKnowledgeItem,
  DeleteKnowledgeItems,
  FetchKnowledgeCategories,
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
  { value: "url", label: "Website Pages", countKey: "urls" },
  { value: "faq", label: "Q&A", countKey: "faqs" },
];

/** The values of a comma-separated URL param. */
function splitParam(value: string) {
  return value.split(",").filter(Boolean);
}

/**
 * One knowledge category's list: the same tabs, search, filters and bulk
 * actions as the whole library, limited to the items filed under it.
 *
 * `categorySlug` is the category's slug, or `KNOWLEDGE_UNCATEGORIZED_ROUTE`
 * for the knowledge that is filed under none.
 */
export default function KnowledgeLibraryTabContent({
  categorySlug,
}: {
  categorySlug: string;
}) {
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
  const {
    FetchKnowledgeCategoriesData: categoriesData,
    FetchKnowledgeCategoriesIsLoading: categoriesLoading,
  } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.FetchKnowledgeCategoriesState,
  );

  // The category being shown: its heading comes from the categories list,
  // which is loaded here when the page is opened directly.
  const isUncategorized = categorySlug === KNOWLEDGE_UNCATEGORIZED_ROUTE;
  // The "all knowledge" list is not one category: it has no category filter.
  const isAll = categorySlug === KNOWLEDGE_ALL_ROUTE;
  const categoryFilter = isUncategorized
    ? KNOWLEDGE_UNCATEGORIZED_FILTER
    : categorySlug;
  const categoryFilters = isAll ? [] : [categoryFilter];

  // All list filters live in the URL (?q=&type=&source=&status=&page=&pageSize=)
  // so a reload, back/forward or a shared link restores the same view.
  const pathname = usePathname() ?? "/knowledge";
  const searchParams = useSearchParams();

  // Only the imported pages that wait for the user's approval (from the
  // checklist drawer); a list of everything has no such filter otherwise.
  const approvalWaiting =
    isAll && searchParams?.get(KNOWLEDGE_APPROVAL_WAITING_PARAM) === "true";

  const category = isAll
    ? approvalWaiting
      ? {
          name: KNOWLEDGE_APPROVAL_WAITING_NAME,
          description: KNOWLEDGE_APPROVAL_WAITING_DESCRIPTION,
        }
      : { name: KNOWLEDGE_ALL_NAME, description: KNOWLEDGE_ALL_DESCRIPTION }
    : isUncategorized
      ? {
          name: KNOWLEDGE_UNCATEGORIZED_NAME,
          description: KNOWLEDGE_UNCATEGORIZED_DESCRIPTION,
        }
      : categoriesData?.categories.find((entry) => entry.slug === categorySlug);
  // The categories have loaded and none has this slug (a mistyped or
  // deactivated one).
  const categoryNotFound =
    !isUncategorized &&
    !isAll &&
    categoriesData !== null &&
    category === undefined;

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
        knowledgeCategory: categoryFilters,
        approvalWaiting,
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
    categoryFilter,
    approvalWaiting,
  ]);

  // The counts on the tabs and the "Added by" list cover only this category.
  const loadStats = useCallback(() => {
    if (storeCode)
      dispatch(
        FetchKnowledgeStats({ storeCode, knowledgeCategory: categoryFilters }),
      );
    // categoryFilters is rebuilt on every render; categoryFilter and isAll
    // are what it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, storeCode, categoryFilter, isAll]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (storeCode && !isUncategorized && !isAll && categoriesData === null)
      dispatch(FetchKnowledgeCategories({ storeCode }));
  }, [dispatch, storeCode, isUncategorized, isAll, categoriesData]);

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

  if (categoryNotFound) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Link
          href="/knowledge"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          Knowledge
        </Link>
        <div className="rounded-xl border bg-card px-4 py-10 text-center">
          <h2 className="text-base font-semibold">Category Not Found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This category doesn&apos;t exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-3">
        <Link
          href="/knowledge"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          Knowledge
        </Link>
        <PageHeading
          title={
            category?.name ?? (categoriesLoading ? "Loading…" : "Category")
          }
          description={category?.description}
          // On a phone the description is left out.
          descriptionClassName="max-sm:hidden"
        />
      </div>
      <div className="flex w-full flex-col gap-4">
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
            {items.length} Of {totalCount} Items
          </span>
        </div>

        <>
          {selectedItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {selectedItems.length} Selected
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
                    : `Publish ${selectedDrafts.length} ${selectedDrafts.length === 1 ? "Draft" : "Drafts"}`}
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
            emptyDescription="Knowledge filed under this category will show up here."
            showAddButton={false}
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

        <AlertDialog
          open={itemToDelete !== null}
          onOpenChange={(open) => {
            if (!open) setItemToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete This Knowledge?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove{" "}
                <strong className="font-semibold break-words text-foreground">
                  {itemToDelete?.title}
                </strong>
                . This action cannot be undone.
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
                  ? "Publish This Knowledge?"
                  : `Publish ${publishTargets.length} Knowledge Items?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {publishTargets.length === 1 ? (
                  <>
                    <strong className="font-semibold break-words text-foreground">
                      {publishTargets[0].title}
                    </strong>{" "}
                    will be processed and added to what your AI knows.
                  </>
                ) : (
                  "They will be processed and added to what your AI knows."
                )}{" "}
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
                Delete {selectedItems.length} Knowledge{" "}
                {selectedItems.length === 1 ? "Item" : "Items"}?
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
