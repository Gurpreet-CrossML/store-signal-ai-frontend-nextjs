"use client";

import { IconChevronRight } from "@tabler/icons-react";

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
import { SideBarMenuItem } from "@/lib/sidebar-navs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

export function NavMain({ items }: { items: SideBarMenuItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <StoreSelector />
        <SidebarMenu>
          {items.map((item) => {
            if (item.items && item.items.length > 0) {
              return (
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
                        {item.items?.map((subItem) => {
                          if (subItem.items && subItem.items.length > 0) {
                            return (
                              <Collapsible
                                key={subItem.title}
                                asChild
                                defaultOpen={subItem.isExpanded}
                                className="group/sub-collapsible"
                              >
                                <SidebarMenuSubItem>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuSubButton className="w-full flex justify-between cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        {subItem.icon && (
                                          <subItem.icon className="h-4 w-4" />
                                        )}
                                        <span>{subItem.title}</span>
                                      </div>
                                      <IconChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90" />
                                    </SidebarMenuSubButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {subItem.items.map((nestedItem) => (
                                        <SidebarMenuSubItem
                                          key={nestedItem.title}
                                        >
                                          <SidebarMenuSubButton
                                            className={cn(
                                              pathname == nestedItem.url
                                                ? "min-w-8 bg-purple-200 text-primary duration-200 ease-linear hover:bg-purple-200/90 hover:text-primary active:bg-purple-200/90 active:text-primary"
                                                : "",
                                            )}
                                            asChild
                                          >
                                            <Link href={nestedItem.url}>
                                              {nestedItem.icon && (
                                                <nestedItem.icon
                                                  className={cn(
                                                    pathname == nestedItem.url
                                                      ? "text-primary! h-4 w-4"
                                                      : "h-4 w-4",
                                                  )}
                                                />
                                              )}
                                              <span>{nestedItem.title}</span>
                                            </Link>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </SidebarMenuSubItem>
                              </Collapsible>
                            );
                          }

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                className={cn(
                                  pathname == subItem.url
                                    ? "min-w-8 bg-purple-200 text-primary duration-200 ease-linear hover:bg-purple-200/90 hover:text-primary active:bg-purple-200/90 active:text-primary"
                                    : "",
                                )}
                                asChild
                              >
                                <Link href={subItem.url}>
                                  {subItem.icon && (
                                    <subItem.icon
                                      className={cn(
                                        pathname == subItem.url
                                          ? "text-primary!"
                                          : "",
                                      )}
                                    />
                                  )}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={cn(
                    pathname == item.url
                      ? "min-w-8 bg-purple-200 text-primary duration-200 ease-linear hover:bg-purple-200/90 hover:text-primary active:bg-primary/90 active:text-primary"
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
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
