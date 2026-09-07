"use client";

import { useEffect, useMemo, useState } from "react";
import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StoreSetupForm } from "@/components/custom/store-setup-form";
import { ShopifyConnectProgress } from "@/components/custom/shopify-connect-progress";
import { DataTable } from "@/components/custom/data-table";
import { PAGE_SIZE_OPTIONS } from "@/components/custom/threads-data-table-pagination";
import { SearchInput } from "@/components/custom/search-input";
import { StoreAllowedIpsDrawer } from "@/components/custom/store-allowed-ips-drawer";
import { StoreWidgetScriptDialog } from "@/components/custom/store-widget-script-dialog";
import { getStoreColumns } from "@/components/custom/stores-columns";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  DeactivateStore,
  FetchStoresList,
  GetStores,
  setSelectedStore,
  type StoreListItem,
} from "@/redux/api-slice/stores-slice";

export default function SettingsStore() {
  const dispatch = useAppDispatch();
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchStoresListData, FetchStoresListIsLoading } = useAppSelector(
    (state) => state.GetStoresReducer.FetchStoresListState,
  );
  const { DeactivateStoreIsLoading } = useAppSelector(
    (state) => state.GetStoresReducer.DeactivateStoreState,
  );

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  // The smallest entry in the shared pagination bar's options — anything
  // else leaves its "Rows per page" select showing no value.
  const [limit, setLimit] = useState(PAGE_SIZE_OPTIONS[0]);

  const [connectOpen, setConnectOpen] = useState(false);
  const [ipsTarget, setIpsTarget] = useState<StoreListItem | null>(null);
  const [scriptTarget, setScriptTarget] = useState<StoreListItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<StoreListItem | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Shopify's OAuth return lands on this page while the callback is still
  // creating the store, so the mount fetch can race it; refetch again once
  // the layout's return handler reports success.
  const shopifyConnected = useAppSelector(
    (state) =>
      state.GetOnboardingReducer.CompleteShopifyOauthState
        .CompleteShopifyOauthIsSuccess,
  );

  const request = useMemo(
    () => ({ searchvalue: debouncedSearch, page, limit }),
    [debouncedSearch, page, limit],
  );
  useEffect(() => {
    dispatch(FetchStoresList(request));
  }, [dispatch, request, shopifyConnected]);

  const pagination: PaginationState = { pageIndex: page - 1, pageSize: limit };
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    setPage(next.pageIndex + 1);
    setLimit(next.pageSize);
  };

  const handleSelect = (store: StoreListItem) => {
    dispatch(setSelectedStore(store.code));
    toast.success("Store switched", {
      description: `The dashboard is now working on ${store.name}.`,
    });
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const { code, name } = deactivateTarget;
    const result = await dispatch(DeactivateStore({ code, name }));
    if (DeactivateStore.fulfilled.match(result)) {
      setDeactivateTarget(null);
      // The deactivated store can't stay selected; clearing the selection
      // lets the switcher's hydrate effect pick a valid one from the
      // refreshed list.
      if (code === selectedStore) dispatch(setSelectedStore(""));
      dispatch(GetStores({}));
      dispatch(FetchStoresList(request));
    }
  };

  const columns = useMemo(
    () =>
      getStoreColumns({
        selectedStore,
        onEditAllowedIps: setIpsTarget,
        onGetWidgetScript: setScriptTarget,
        onSelect: handleSelect,
        onDeactivate: setDeactivateTarget,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStore],
  );

  const hasQuery = debouncedSearch.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search stores..."
          label="Search stores"
          className="w-full max-w-xs"
        />
        <Button onClick={() => setConnectOpen(true)}>
          <IconPlus data-icon="inline-start" />
          Connect Store
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={FetchStoresListData.results}
        totalCount={FetchStoresListData.count}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        isLoading={FetchStoresListIsLoading}
        noun="store"
        emptyTitle={hasQuery ? "No matching stores" : "No stores yet"}
        emptyDescription={
          hasQuery
            ? "Try a different search."
            : "Stores appear here once they are connected to your company."
        }
      />

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect a Store</DialogTitle>
            <DialogDescription>
              Choose your platform and point us at your store. You&apos;ll be
              sent to it to authorize access, then land back here.
            </DialogDescription>
          </DialogHeader>
          <StoreSetupForm redirectToSetting />
        </DialogContent>
      </Dialog>

      <ShopifyConnectProgress />

      <StoreAllowedIpsDrawer
        store={ipsTarget}
        onOpenChange={(open) => !open && setIpsTarget(null)}
      />

      <StoreWidgetScriptDialog
        store={scriptTarget}
        onOpenChange={(open) => !open && setScriptTarget(null)}
      />

      <AlertDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deactivate {deactivateTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              StoreSignal stops working on this store: its chat widget no longer
              loads and the dashboard stops syncing its data. Contact support to
              reactivate it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={DeactivateStoreIsLoading}
              onClick={(event) => {
                event.preventDefault();
                confirmDeactivate();
              }}
            >
              {DeactivateStoreIsLoading
                ? "Deactivating..."
                : "Deactivate Store"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
