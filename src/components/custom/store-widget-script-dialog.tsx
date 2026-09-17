"use client";

import { useEffect } from "react";

import { LoadingState } from "@/components/custom/loading-state";
import { StoreSnippet } from "@/components/custom/go-live-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchWidgetScript,
  type StoreListItem,
} from "@/redux/api-slice/stores-slice";

/**
 * "Get widget script" from a row on Settings → Stores: fetches the store's
 * widget key and shows the same embed block the onboarding go-live step
 * uses, copy button included.
 */
export function StoreWidgetScriptDialog({
  store,
  onOpenChange,
}: {
  /** The store whose script to show; null keeps the dialog closed. */
  store: StoreListItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const { FetchWidgetScriptData, FetchWidgetScriptIsLoading } = useAppSelector(
    (state) => state.GetStoresReducer.FetchWidgetScriptState,
  );

  const storeCode = store?.code ?? "";
  useEffect(() => {
    if (storeCode) dispatch(FetchWidgetScript(storeCode));
  }, [dispatch, storeCode]);

  return (
    <Dialog open={Boolean(store)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Widget Script</DialogTitle>
          <DialogDescription>
            Add this to the storefront so the chat widget loads.
          </DialogDescription>
        </DialogHeader>
        {FetchWidgetScriptIsLoading || !store ? (
          <LoadingState label="Loading widget script…" />
        ) : FetchWidgetScriptData ? (
          <StoreSnippet
            store={{
              code: store.code,
              name: store.name,
              platform: store.platform ?? "",
              widget_key: FetchWidgetScriptData.widget_key,
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
