"use client";

import { useEffect, useState } from "react";
import { IconPlus, IconSearch, IconX } from "@tabler/icons-react";

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
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  DeleteKnowledgeItem,
  FetchKnowledgeItems,
  RetryKnowledgeItemProcessing,
  ToggleKnowledgeItemStatus,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  EMPTY_KNOWLEDGE_FILTERS,
  KnowledgeTypeSourceStatusFilters,
  countActiveKnowledgeFilters,
  type KnowledgeFilterSelection,
} from "@/components/custom/knowledge/knowledge-filters";
import { KnowledgeList } from "@/components/custom/knowledge/knowledge-list";
import { AddKnowledgeDialog } from "@/components/custom/knowledge/add-knowledge-dialog";
import { EditKnowledgeDialog } from "@/components/custom/knowledge/edit-knowledge-dialog";
import { KnowledgeDetailSheet } from "@/components/custom/knowledge/knowledge-detail-sheet";
import { KnowledgeDataTablePagination } from "@/components/custom/knowledge/knowledge-data-table-pagination";

const DEFAULT_PAGE_SIZE = 25;

export default function KnowledgeLibraryTabContent() {
  const dispatch = useAppDispatch();
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

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<KnowledgeFilterSelection>(
    EMPTY_KNOWLEDGE_FILTERS,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<KnowledgeItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);

  const items = FetchKnowledgeItemsListData.results;
  const totalCount = FetchKnowledgeItemsListData.count;
  const activeFilterCount = countActiveKnowledgeFilters(filters);
  const hasFilters = activeFilterCount > 0 || debouncedSearch !== "";

  // Debounce so a request isn't fired per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 whenever the store, page size, or a server-side filter
  // changes — the current page may not exist at a new size or filter set.
  // Adjusted during render against a sentinel, the endorsed alternative to
  // setting state from an effect (same pattern as the Threads screen).
  const filterSignature = JSON.stringify([
    storeCode,
    pageSize,
    debouncedSearch,
    filters.type,
    filters.source,
    filters.status,
  ]);
  const [prevFilterSignature, setPrevFilterSignature] =
    useState(filterSignature);
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature);
    setPage(1);
  }

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
    setDetailOpen(false);
    setEditItem(item);
    setEditOpen(true);
  };

  const handleToggleStatus = async (item: KnowledgeItem) => {
    await dispatch(
      ToggleKnowledgeItemStatus({
        id: item.id,
        storeCode,
        status: item.status === "disabled" ? "active" : "disabled",
      }),
    );
    loadItems();
  };

  const handleRetry = async (item: KnowledgeItem) => {
    await dispatch(RetryKnowledgeItemProcessing({ id: item.id, storeCode }));
    loadItems();
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
          onFiltersChange={setFilters}
        />

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setSearchInput("");
              setFilters(EMPTY_KNOWLEDGE_FILTERS);
            }}
          >
            <IconX />
            Clear
          </Button>
        )}

        <Badge variant="secondary">
          {items.length} of {totalCount}
        </Badge>

        <Button size="sm" className="ml-auto" onClick={() => setAddOpen(true)}>
          <IconPlus className="size-4" />
          Add Knowledge
        </Button>
      </div>

      <KnowledgeList
        items={items}
        isLoading={FetchKnowledgeItemsIsLoading}
        onOpenItem={handleOpenItem}
        onEditItem={handleEditItem}
        onToggleStatus={handleToggleStatus}
        onRetry={handleRetry}
        onDelete={(item) => setItemToDelete(item)}
        onAddKnowledge={() => setAddOpen(true)}
        hasFilters={hasFilters}
      />

      <KnowledgeDataTablePagination
        items={items}
        totalCount={totalCount}
        pageSize={pageSize}
        page={page}
        onPaginationChange={(next) => {
          setPage(next.page);
          setPageSize(next.pageSize);
        }}
      />

      <AddKnowledgeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={loadItems}
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
