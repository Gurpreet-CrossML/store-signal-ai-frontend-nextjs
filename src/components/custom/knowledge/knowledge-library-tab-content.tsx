"use client";

import { useEffect, useMemo, useState } from "react";
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
  type KnowledgeType,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  EMPTY_KNOWLEDGE_FILTERS,
  KnowledgeFilterPopover,
  countActiveKnowledgeFilters,
  type KnowledgeFilterSelection,
} from "@/components/custom/knowledge/knowledge-filters";
import { KnowledgeList } from "@/components/custom/knowledge/knowledge-list";
import { AddKnowledgeDialog } from "@/components/custom/knowledge/add-knowledge-dialog";
import { KnowledgeForm } from "@/components/custom/knowledge/knowledge-form";
import { KnowledgeDetailSheet } from "@/components/custom/knowledge/knowledge-detail-sheet";

function matchesSearch(item: KnowledgeItem, query: string): boolean {
  if (!query) return true;
  const haystack = [
    item.title,
    item.question,
    item.answer,
    item.productName,
    item.url,
    ...(item.categoryNames ?? []),
    ...item.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function KnowledgeLibraryTabContent() {
  const dispatch = useAppDispatch();

  const { FetchKnowledgeItemsListData, FetchKnowledgeItemsIsLoading } =
    useAppSelector(
      (state) => state.GetKnowledgeRagReducer.FetchKnowledgeItemsState,
    );
  const { DeleteKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.DeleteKnowledgeItemState,
  );

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<KnowledgeFilterSelection>(
    EMPTY_KNOWLEDGE_FILTERS,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<KnowledgeItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
  const [editType, setEditType] = useState<KnowledgeType | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);

  const items = FetchKnowledgeItemsListData;
  const activeFilterCount = countActiveKnowledgeFilters(filters);
  const hasFilters = activeFilterCount > 0 || search.trim() !== "";

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.types.length && !filters.types.includes(item.type)) return false;
      if (filters.sources.length && !filters.sources.includes(item.source)) return false;
      if (filters.statuses.length && !filters.statuses.includes(item.status)) return false;
      if (
        filters.aiScopes.length &&
        !filters.aiScopes.some((scope) => item.aiScope.includes(scope))
      ) {
        return false;
      }
      return matchesSearch(item, query);
    });
  }, [items, filters, search]);

  const loadItems = () => {
    dispatch(FetchKnowledgeItems());
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenItem = (item: KnowledgeItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleEditItem = (item: KnowledgeItem) => {
    setDetailOpen(false);
    setEditItem(item);
    setEditType(item.type);
    setEditOpen(true);
  };

  const handleToggleStatus = async (item: KnowledgeItem) => {
    await dispatch(
      ToggleKnowledgeItemStatus({
        id: item.id,
        status: item.status === "disabled" ? "active" : "disabled",
      }),
    );
    loadItems();
  };

  const handleRetry = async (item: KnowledgeItem) => {
    await dispatch(RetryKnowledgeItemProcessing({ id: item.id }));
    loadItems();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const result = await dispatch(DeleteKnowledgeItem({ id: itemToDelete.id }));
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
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search knowledge…"
            className="pl-8"
            aria-label="Search knowledge"
          />
        </div>

        <KnowledgeFilterPopover
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          filters={filters}
          onFiltersChange={setFilters}
          activeCount={activeFilterCount}
        />

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setSearch("");
              setFilters(EMPTY_KNOWLEDGE_FILTERS);
            }}
          >
            <IconX />
            Clear
          </Button>
        )}

        <Badge variant="secondary">
          {filteredItems.length} of {items.length}
        </Badge>

        <Button size="sm" className="ml-auto" onClick={() => setAddOpen(true)}>
          <IconPlus className="size-4" />
          Add Knowledge
        </Button>
      </div>

      <KnowledgeList
        items={filteredItems}
        isLoading={FetchKnowledgeItemsIsLoading}
        onOpenItem={handleOpenItem}
        onEditItem={handleEditItem}
        onToggleStatus={handleToggleStatus}
        onRetry={handleRetry}
        onDelete={(item) => setItemToDelete(item)}
        onAddKnowledge={() => setAddOpen(true)}
        hasFilters={hasFilters}
      />

      <AddKnowledgeDialog open={addOpen} onOpenChange={setAddOpen} onSaved={loadItems} />

      <KnowledgeForm
        open={editOpen}
        onOpenChange={setEditOpen}
        type={editType}
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
              This will permanently remove &quot;{itemToDelete?.title}&quot;. This
              action cannot be undone.
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
