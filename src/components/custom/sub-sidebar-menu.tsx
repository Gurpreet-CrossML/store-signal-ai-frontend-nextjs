"use client";

import Link from "next/link";
import { Icon, IconChevronRight } from "@tabler/icons-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { EXPANDED_MENU_BUTTON } from "@/components/custom/nav-main";
import { isMenuItemActive, type SideBarMenuItem } from "@/lib/sidebar-navs";
import { cn } from "@/lib/utils";

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
          <SidebarMenuButton
            // No tooltip: the label is right there. Tooltips exist to name
            // an icon that has none.
            className={cn("w-full", EXPANDED_MENU_BUTTON)}
          >
            {ItemIcon && <ItemIcon />}
            <span>{title}</span>
            <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="group-data-[collapsible=icon]:flex">
            {items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  isActive={isMenuItemActive(pathname, subItem.url)}
                  className="group-data-[collapsible=icon]:flex data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15"
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
