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
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  isMenuItemActive,
  MainSidebarMenuItem,
  SideBarMenuItem,
} from "@/lib/sidebar-navs";
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
  items?: MainSidebarMenuItem[];
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
                  isActive={isMenuItemActive(pathname, subItem.url)}
                  className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15"
                  asChild
                >
                  <Link href={subItem.url}>
                    {subItem.icon && (
                      <subItem.icon
                        className={cn(
                          isMenuItemActive(pathname, subItem.url)
                            ? "text-primary!"
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
  );
}

export function SidebarMenuItemWrapper({
  item,
  pathname,
  isActive,
  expanded = false,
}: {
  item: SideBarMenuItem;
  pathname: string | null;
  /**
   * Overrides the path-based check. Sub-sidebar entries can carry a query
   * string, and which of a group of siblings wins is decided once by
   * `activeNavUrl` rather than re-derived per item.
   */
  isActive?: boolean;
  /**
   * Render as a full-width labelled row instead of a collapsed icon.
   *
   * The whole sidebar is pinned to its collapsed state, so every button
   * inside it — including the sub-sidebar's, which has room to spare —
   * inherits the icon-mode rules that force a 36px square and clip the
   * label. This opts those rules back out, and drops the tooltip, which
   * only exists to name an icon that has no visible label.
   */
  expanded?: boolean;
}) {
  const active = isActive ?? isMenuItemActive(pathname, item.url);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={expanded ? undefined : item.title}
        isActive={active}
        className={cn(
          "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:hover:text-primary",
          expanded &&
            "group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:size-auto! group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:[&_svg]:size-4",
        )}
        asChild
      >
        <Link href={item.url}>
          {item.icon && (
            <item.icon className={cn(active ? "text-primary!" : "")} />
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
  item: MainSidebarMenuItem;
  pathname: string | null;
}) {
  return (
    <SidebarGroup className="-ml-2">
      <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {item.items?.map((subItem) => {
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

export function NavMain({ items }: { items: MainSidebarMenuItem[] }) {
  return (
    <Suspense fallback={null}>
      <NavMainContent items={items} />
    </Suspense>
  );
}

function NavMainContent({ items }: { items: MainSidebarMenuItem[] }) {
  const pathname = usePathname();

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
                  pathname={pathname}
                />
              );
            }

            if (item.items && item.items.length > 0) {
              return (
                <CollapsibleMenuItem
                  key={item.title}
                  pathname={pathname}
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
                pathname={pathname}
              />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
