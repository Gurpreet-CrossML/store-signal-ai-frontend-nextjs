"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  GetStores,
  setSelectedStore,
  SELECTED_STORE_KEY,
} from "@/redux/api-slice/stores-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { SideBarMenuItem } from "@/lib/sidebar-navs";
import { cn } from "@/lib/utils";

function StoreSelector() {
  const dispatch = useAppDispatch();
  const { GetStoresListData } = useAppSelector(
    (state) => state.GetStoresReducer.GetStoresState,
  );
  const selectedStore = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  useEffect(() => {
    if (!GetStoresListData.length) dispatch(GetStores({}));
  }, [GetStoresListData.length, dispatch]);

  useEffect(() => {
    if (!GetStoresListData.length || selectedStore) return;
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(SELECTED_STORE_KEY)
        : null;
    const isValid =
      !!stored && GetStoresListData.some((store) => store.code === stored);

    dispatch(setSelectedStore(isValid ? stored! : GetStoresListData[0].code));
  }, [GetStoresListData, selectedStore, dispatch]);

  return (
    <Select
      value={selectedStore}
      onValueChange={(value) => dispatch(setSelectedStore(value))}
    >
      <SelectTrigger className="mb-2 w-full">
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

export function NavMain({ items }: { items: SideBarMenuItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <StoreSelector />
        <SidebarMenu>
          {items.map((item) =>
            item.items?.length ? (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isExpanded}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            className={cn(
                              pathname === subItem.url
                                ? "min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                                : "",
                            )}
                            asChild
                          >
                            <Link href={subItem.url}>
                              {subItem.icon && (
                                <subItem.icon
                                  className={cn(
                                    pathname === subItem.url
                                      ? "text-primary-foreground!"
                                      : "",
                                  )}
                                />
                              )}
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={cn(
                    pathname === item.url
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
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
