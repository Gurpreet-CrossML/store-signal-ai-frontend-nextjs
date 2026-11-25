"use client";

import { useEffect } from "react";
import {
  IconBuildingStore,
  IconCheck,
  IconSelector,
} from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import {
  GetStores,
  setSelectedStore,
  SELECTED_STORE_KEY,
} from "@/redux/api-slice/stores-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/**
 * Store switcher in the sidebar header — the sidebar-07 team-switcher
 * pattern, backed by the store list from Redux.
 */
export function StoreSwitcher() {
  const dispatch = useAppDispatch();
  const { isMobile } = useSidebar();

  const {
    GetStoresIsLoading,
    GetStoresIsSuccess,
    GetStoresIsError,
    GetStoresListData,
  } = useAppSelector((state) => state.GetStoresReducer.GetStoresState);
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  // Fetch the store list once.
  useEffect(() => {
    if (!GetStoresListData.length) {
      dispatch(GetStores({}));
    }
  }, [GetStoresListData.length, dispatch]);

  // Hydrate the selection from localStorage once the list is available.
  // Falls back to the first store if nothing is stored or the stored code
  // is no longer valid (e.g. the store was removed).
  useEffect(() => {
    if (!GetStoresListData.length || selectedStore) return;

    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(SELECTED_STORE_KEY)
        : null;
    const isValid =
      !!stored && GetStoresListData.some((s) => s.code === stored);

    dispatch(setSelectedStore(isValid ? stored! : GetStoresListData[0].code));
  }, [GetStoresListData, selectedStore, dispatch]);

  const activeStore = GetStoresListData.find(
    (store) => store.code === selectedStore,
  );

  // Also loading before the first request resolves: the flag starts false,
  // so keying only on it flashes an empty switcher on the first paint.
  const showLoading =
    !GetStoresListData.length &&
    (GetStoresIsLoading || (!GetStoresIsSuccess && !GetStoresIsError));

  if (showLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          {/* The real switcher, disabled, with the icon slot spinning — an
              empty gap or a bare skeleton reads as "nothing here" rather
              than "loading". Also keeps the icon meaningful when the
              sidebar is collapsed to icons. */}
          <SidebarMenuButton size="lg" disabled tooltip="Loading stores…">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Spinner className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading stores…</span>
            </div>
            <IconSelector className="ml-auto" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={activeStore?.name ?? "Select a store"}
              disabled={!GetStoresListData.length}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <IconBuildingStore className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeStore?.name ?? "Select a store"}
                </span>
                <span className="truncate text-xs">
                  {activeStore?.code ?? "No stores connected"}
                </span>
              </div>
              <IconSelector className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Stores
            </DropdownMenuLabel>
            {GetStoresListData.map((store) => (
              <DropdownMenuItem
                key={store.id}
                onClick={() => dispatch(setSelectedStore(store.code))}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <IconBuildingStore className="size-3.5 shrink-0" />
                </div>
                <span className="min-w-0 flex-1 truncate">{store.name}</span>
                {store.code === selectedStore && (
                  <IconCheck className="size-4 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
