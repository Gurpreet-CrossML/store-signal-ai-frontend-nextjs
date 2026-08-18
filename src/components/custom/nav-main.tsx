"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

/**
 * Opt a menu button out of the sidebar's icon-mode rules.
 *
 * The whole sidebar is pinned collapsed, so every button inside inherits
 * `size-9!` and a clipped label — fine on the icon rail, wrong in the
 * sub-sidebar, which has the width. Height and width are both `!` here:
 * the earlier `size-auto!` set `width: auto !important`, which beat the
 * plain `w-full` beside it and left every row shrunk to its own text.
 *
 * Shared so the plain rows and the collapsible groups cannot drift apart.
 */
export const EXPANDED_MENU_BUTTON =
  "group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:[&_svg]:size-4";

export function SidebarMenuItemWrapper({
  item,
  pathname,
  isActive,
  expanded = false,
}: {
  item: SideBarMenuItem & { activeBasePath?: string };
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
  const active =
    isActive ?? isMenuItemActive(pathname, item.activeBasePath ?? item.url);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={expanded ? undefined : item.title}
        isActive={active}
        className={cn(
          "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:hover:text-primary",
          expanded && EXPANDED_MENU_BUTTON,
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
