"use client";

import { useState } from "react";
import { IconTrash } from "@tabler/icons-react";

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
import { Typography } from "@/components/ui/typography";
import {
  KnowledgeSourceIcon,
  KnowledgeStatusBadge,
} from "@/components/custom/knowledge/knowledge-badges";
import { KNOWLEDGE_SOURCE_LABEL } from "@/components/custom/knowledge/knowledge-meta";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  DeleteKnowledgeItem,
  FetchKnowledgeItems,
  type KnowledgeItem,
} from "@/redux/api-slice/knowledge-rag-slice";

export function KnowledgeEntryRow({ item }: { item: KnowledgeItem }) {
  const dispatch = useAppDispatch();
  const { DeleteKnowledgeItemIsLoading } = useAppSelector(
    (state) => state.GetKnowledgeRagReducer.DeleteKnowledgeItemState,
  );
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRemove = async () => {
    const result = await dispatch(
      DeleteKnowledgeItem({ id: item.id, storeCode }),
    );
    if (DeleteKnowledgeItem.fulfilled.match(result)) {
      setConfirmOpen(false);
      dispatch(FetchKnowledgeItems({ storeCode, pageSize: 100 }));
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5">
        <KnowledgeSourceIcon source={item.source} />
        <div className="min-w-0 flex-1">
          <Typography variant="small" as="p" className="truncate font-medium">
            {item.title}
          </Typography>
          <Typography variant="muted" className="text-xs">
            {KNOWLEDGE_SOURCE_LABEL[item.source]}
          </Typography>
        </div>
        <KnowledgeStatusBadge status={item.status} />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
          aria-label="Remove"
        >
          <IconTrash className="size-4" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{item.title}&quot;. This action
              cannot be undone.
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
                handleRemove();
              }}
            >
              {DeleteKnowledgeItemIsLoading ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
