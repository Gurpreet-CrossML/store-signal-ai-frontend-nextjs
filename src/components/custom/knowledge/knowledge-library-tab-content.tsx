"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IconCopy,
  IconFileText,
  IconLink,
  IconMessageQuestion,
  IconPlus,
  IconSearch,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useCan } from "@/hooks/use-can";
import {
  DeleteKnowledgeItem,
  FetchKnowledgeItems,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  KnowledgeTypeSourceStatusFilters,
  countActiveKnowledgeFilters,
  type KnowledgeFilterSelection,
} from "@/components/custom/knowledge/knowledge-filters";
import { KnowledgeList } from "@/components/custom/knowledge/knowledge-list";
import { EditKnowledgeDialog } from "@/components/custom/knowledge/edit-knowledge-dialog";
import { KnowledgeDetailSheet } from "@/components/custom/knowledge/knowledge-detail-sheet";
import { KnowledgeDataTablePagination } from "@/components/custom/knowledge/knowledge-data-table-pagination";
import { PAGE_SIZE_OPTIONS } from "@/components/custom/threads-data-table-pagination";
import {
  KNOWLEDGE_STATUS_META,
  KNOWLEDGE_TYPE_META,
} from "@/components/custom/knowledge/knowledge-meta";
import type {
  KnowledgeSource,
  KnowledgeStatus,
  KnowledgeType,
} from "@/redux/api-slice/knowledge-rag-slice";

const DEFAULT_PAGE_SIZE = 25;

// Source tabs above the list; each maps to the `source` API filter.
const SOURCE_TABS: {
  value: KnowledgeSource | "all";
  label: string;
  icon: typeof IconCopy;
}[] = [
  { value: "all", label: "All", icon: IconCopy },
  { value: "file", label: "Documents", icon: IconFileText },
  { value: "url", label: "URLs", icon: IconLink },
  { value: "faq", label: "FAQs", icon: IconMessageQuestion },
];

export default function KnowledgeLibraryTabContent() {
  const dispatch = useAppDispatch();
  const canEditKnowledge = useCan("knowledge", { write: true });
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchKnowledgeItemsListData, FetchKnowledgeItemsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchKnowledgeItemsState,
    );
  const { DeleteKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.DeleteKnowledgeItemState,
  );

  // All list filters live in the URL (?q=&type=&source=&status=&page=&pageSize=)
  // so a reload, back/forward or a shared link restores the same view.
  const router = useRouter();
  const pathname = usePathname() ?? "/knowledge/library";
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams?.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSizeParam = Number(searchParams?.get("pageSize"));
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam)
    ? pageSizeParam
    : DEFAULT_PAGE_SIZE;
  const debouncedSearch = (searchParams?.get("q") ?? "").trim();
  const typeParam = searchParams?.get("type") ?? "";
  const sourceParam = searchParams?.get("source") ?? "";
  const statusParam = searchParams?.get("status") ?? "";
  const filters: KnowledgeFilterSelection = {
    type: (typeParam in KNOWLEDGE_TYPE_META ? typeParam : "") as
      | KnowledgeType
      | "",
    source: (["file", "url", "faq"].includes(sourceParam)
      ? sourceParam
      : "") as KnowledgeSource | "",
    status: (statusParam in KNOWLEDGE_STATUS_META ? statusParam : "") as
      | KnowledgeStatus
      | "",
  };

  const updateParams = useCallback(
    (changes: Record<string, string | number | null>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  const [searchInput, setSearchInput] = useState(debouncedSearch);
  const [detailItem, setDetailItem] = useState<KnowledgeItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);

  const items = FetchKnowledgeItemsListData.results;
  const totalCount = FetchKnowledgeItemsListData.count;
  const activeFilterCount = countActiveKnowledgeFilters(filters);
  const hasFilters =
    activeFilterCount > 0 || filters.source !== "" || debouncedSearch !== "";
  const hasClearableFilters = activeFilterCount > 0 || debouncedSearch !== "";
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
        type: filters.type || undefined,
        source: filters.source || undefined,
        status: filters.status || undefined,
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
    filters.type,
    filters.source,
    filters.status,
  ]);

  const handleOpenItem = (item: KnowledgeItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleEditItem = (item: KnowledgeItem) => {
    if (item.status !== "completed") return;
    setDetailOpen(false);
    setEditItem(item);
    setEditOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const result = await dispatch(
      DeleteKnowledgeItem({ id: itemToDelete.id, storeCode }),
    );
    if (DeleteKnowledgeItem.fulfilled.match(result)) {
      setItemToDelete(null);
      loadItems();
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {!isEmptyLibrary && (
        <Tabs
          value={filters.source || "all"}
          onValueChange={(value) =>
            updateParams({ source: value === "all" ? null : value, page: null })
          }
        >
          <TabsList variant="line" className="h-10 w-full justify-start">
            {SOURCE_TABS.map(({ value, label, icon: TabIcon }) => (
              <TabsTrigger key={value} value={value} className="flex-none px-3">
                <TabIcon />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      {!isEmptyLibrary && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title…"
              className="pl-8"
              aria-label="Search knowledge"
            />
          </div>

          <KnowledgeTypeSourceStatusFilters
            filters={filters}
            onFiltersChange={(next) =>
              updateParams({
                type: next.type,
                status: next.status,
                page: null,
              })
            }
          />

          {hasClearableFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setSearchInput("");
                updateParams({
                  q: null,
                  type: null,
                  status: null,
                  page: null,
                });
              }}
            >
              <IconX />
              Clear
            </Button>
          )}

          <Badge variant="secondary">
            {items.length} of {totalCount}
          </Badge>

          <Button
            size="sm"
            variant="ghost"
            className="ml-auto mr-2"
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

          {canEditKnowledge && (
            <Button size="sm" asChild>
              <Link href="/knowledge/library/new">
                <IconPlus className="size-4" />
                Add Knowledge
              </Link>
            </Button>
          )}
        </div>
      )}

      <KnowledgeList
        items={items}
        isLoading={FetchKnowledgeItemsIsLoading}
        onOpenItem={handleOpenItem}
        onEditItem={handleEditItem}
        onDelete={(item) => setItemToDelete(item)}
        hasFilters={hasFilters}
        canEdit={canEditKnowledge}
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

      <EditKnowledgeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        item={editItem}
        onSaved={loadItems}
      />

      <KnowledgeDetailSheet
        item={detailItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditItem}
        onDeleted={loadItems}
      />

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
    </div>
  );
}
