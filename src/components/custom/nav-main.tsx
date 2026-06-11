"use client";

import { type Icon } from "@tabler/icons-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  GetStores,
  setSelectedStore,
  SELECTED_STORE_KEY,
} from "@/redux/api-slice/stores-slice";
import { useEffect } from "react";

function StoreSelector() {
  const dispatch = useAppDispatch();

  const { GetStoresListData } = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState,
  );
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

  const handelChange = (value: string) => {
    dispatch(setSelectedStore(value));
  };

  return (
    <Select value={selectedStore} onValueChange={handelChange}>
      <SelectTrigger className="w-full mb-2">
        <SelectValue placeholder="Select a Store" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Stores</SelectLabel>
          {GetStoresListData.map((store) => (
            <SelectItem key={store.id} value={store.code}>
              {store.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <StoreSelector />
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className={cn(
                  pathname == item.url
                    ? "min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                    : "",
                )}
                asChild
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
