"use client";

import { Icon, IconChevronRight } from "@tabler/icons-react";

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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  GetStores,
  setSelectedStore,
  SELECTED_STORE_KEY,
} from "@/redux/api-slice/stores-slice";
import { Suspense, useEffect } from "react";
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

function CollapsibleMenuItem({
  pathname,
  title,
  icon: ItemIcon,
  defaultOpen,
  items,
}: {
  pathname: string | null;
  title: string;
  icon?: Icon;
  defaultOpen?: boolean;
  items?: SideBarMenuItem[];
}) {
  return (
    <Collapsible
      asChild
      defaultOpen={defaultOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title}>
            {ItemIcon && <ItemIcon />}
            <span>{title}</span>
            <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items?.map((subItem) => (
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
                          pathname == subItem.url ? "text-primary!" : "",
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
  );
}

function SidebarMenuItemWrapper({
  item,
  pathname,
}: {
  item: SideBarMenuItem;
  pathname: string | null;
}) {
  return (
    <SidebarMenuItem>
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
}

function SidebarGroupWrapper({
  item,
  pathname,
}: {
  item: SideBarMenuItem;
  pathname: string | null;
}) {
  return (
    <SidebarGroup className="-ml-2">
      <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {item.items?.map((subItem) => (
            <SidebarMenuItemWrapper
              key={subItem.title}
              item={subItem}
              pathname={pathname}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavMain({ items }: { items: SideBarMenuItem[] }) {
  return (
    <Suspense fallback={null}>
      <NavMainContent items={items} />
    </Suspense>
  );
}

function NavMainContent({ items }: { items: SideBarMenuItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentUrl = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <StoreSelector />
        <SidebarMenu>
          {items.map((item) => {
            if (item.items && item.items.length > 0 && item.isMenuHeading) {
              return (
                <SidebarGroupWrapper
                  key={item.title}
                  item={item}
                  pathname={currentUrl}
                />
              );
            }

            if (item.items && item.items.length > 0) {
              return (
                <CollapsibleMenuItem
                  key={item.title}
                  pathname={currentUrl}
                  title={item.title}
                  icon={item.icon}
                  defaultOpen={item.isExpanded}
                  items={item.items}
                />
              );
            }

            return (
              <SidebarMenuItemWrapper
                key={item.title}
                item={item}
                pathname={currentUrl}
              />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
