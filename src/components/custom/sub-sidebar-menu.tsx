"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon, IconChevronRight } from "@tabler/icons-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  EXPANDED_MENU_BUTTON,
  SidebarMenuItemWrapper,
} from "@/components/custom/nav-main";
import { keepHelpdeskListParams } from "@/lib/helpdesk-filters";
import {
  isBranchActive,
  type SideBarMenuItem,
  type SubSidebarMenuItem,
} from "@/lib/sidebar-navs";
import { cn, titleWhenClipped } from "@/lib/utils";

/**
 * A sub-sidebar section that holds its own screens.
 *
 * Sub-sidebar only, by design and by location: the icon rail has no room
 * for a label, let alone a nested list, so a collapsible there would be a
 * chevron on a 36px square with its children hidden by the registry's
 * icon-mode rules. Keeping it out of nav-main means it cannot drift back.
 *
 * Those same icon-mode rules apply here — the sub-sidebar lives inside a
 * Sidebar pinned to its collapsed state — so the trigger, the sub list and
 * each child opt out of them explicitly. Without that the group rendered
 * as a lone icon with nothing beneath it.
 */
export function CollapsibleMenuItem({
  activeUrl,
  title,
  icon: ItemIcon,
  defaultOpen,
  count,
  items,
}: {
  /**
   * The url of the one entry that is open, as `activeNavUrl` decided it.
   * Not re-derived from the path here: the entries of a group can share a
   * path and differ only by query string.
   */
  activeUrl: string | null;
  title: string;
  icon?: Icon;
  defaultOpen?: boolean;
  /** The group's own count, shown on its heading. */
  count?: number;
  items?: SideBarMenuItem[];
}) {
  const search = useSearchParams()?.toString() ?? "";

  return (
    <Collapsible
      asChild
      defaultOpen={defaultOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            // No tooltip: the label is right there. Tooltips exist to name
            // an icon that has none.
            className={cn("w-full", EXPANDED_MENU_BUTTON)}
          >
            {ItemIcon && <ItemIcon />}
            <span>{title}</span>
            {count !== undefined && (
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            )}
            <IconChevronRight
              className={cn(
                "transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
                count === undefined && "ml-auto",
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mr-0 pr-0 group-data-[collapsible=icon]:flex">
            {items?.map((subItem) => {
              const isActive = subItem.url === activeUrl;

              return (
                <SidebarMenuSubItem key={subItem.url}>
                  <SidebarMenuSubButton
                    isActive={isActive}
                    className="group-data-[collapsible=icon]:flex data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15"
                    asChild
                  >
                    <Link href={keepHelpdeskListParams(subItem.url, search)}>
                      {subItem.icon && (
                        <subItem.icon
                          style={
                            subItem.color ? { color: subItem.color } : undefined
                          }
                          // An item with its own colour keeps it when active.
                          className={cn(
                            isActive && !subItem.color && "text-primary!",
                          )}
                        />
                      )}
                      <span
                        className="flex-1 truncate"
                        onMouseEnter={titleWhenClipped}
                      >
                        {subItem.title}
                      </span>
                      {subItem.count !== undefined && (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {subItem.count}
                        </span>
                      )}
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

/**
 * An area's sub-navigation: its action button, then its screens, with
 * nested groups collapsible. Shared by the docked sub-sidebar and the
 * phone drawer so the two cannot list different things.
 */
export function SubSidebarList({
  menu,
  pathname,
  search,
  activeUrl,
}: {
  menu: SubSidebarMenuItem;
  pathname: string | null;
  /** The current query string, without the leading "?". */
  search: string;
  /** The one open entry, as `activeNavUrl` decided it. */
  activeUrl: string | null;
}) {
  return (
    <>
      {menu.action && <menu.action />}
      <SidebarMenu>
        {menu.items.map((item) => {
          if (item.items && item.items.length > 0) {
            return (
              <CollapsibleMenuItem
                key={item.title}
                activeUrl={activeUrl}
                title={item.title}
                count={item.count}
                icon={item.icon}
                // Open when anything inside is the current screen — the
                // parent is a heading, not a link, so it is never the
                // active url itself.
                defaultOpen={isBranchActive(item, pathname, search)}
                items={item.items}
              />
            );
          }
          return (
            <SidebarMenuItemWrapper
              key={item.title}
              // Which one is active is decided on the plain url; only the
              // link carries the list's filter and sort along.
              item={{
                ...item,
                url: keepHelpdeskListParams(item.url, search),
              }}
              pathname={pathname}
              isActive={item.url === activeUrl}
              expanded
            />
          );
        })}
      </SidebarMenu>
    </>
  );
}
