"use client";

import { Icon, IconChevronRight } from "@tabler/icons-react";

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
import { Suspense } from "react";
import { SideBarMenuItem } from "@/lib/sidebar-navs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
                  isActive={pathname == subItem.url}
                  className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15"
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
        isActive={pathname == item.url}
        className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:hover:text-primary"
        asChild
      >
        <Link href={item.url}>
          {item.icon && (
            <item.icon
              className={cn(pathname == item.url ? "text-primary!" : "")}
            />
          )}
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
          {item.items?.map((subItem) => {
            if (subItem.items && subItem.items.length > 0) {
              return (
                <CollapsibleMenuItem
                  key={subItem.title}
                  pathname={pathname}
                  title={subItem.title}
                  icon={subItem.icon}
                  defaultOpen={subItem.isExpanded}
                  items={subItem.items}
                />
              );
            }
            return (
              <SidebarMenuItemWrapper
                key={subItem.title}
                item={subItem}
                pathname={pathname}
              />
            );
          })}
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
