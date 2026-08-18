"use client";

import * as React from "react";

import { NavMain, SidebarMenuItemWrapper } from "@/components/custom/nav-main";
import { CollapsibleMenuItem } from "@/components/custom/sub-sidebar-menu";
import { StoreSwitcher } from "@/components/custom/store-switcher";
import { NavSecondary } from "@/components/custom/nav-secondary";
import { NavUser } from "@/components/custom/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  activeNavUrl,
  flattenMenuItems,
  isBranchActive,
  sidebarMenus,
  SubSidebarMenuItem,
} from "@/lib/sidebar-navs";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  IconLayoutSidebar,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function AppSidebar({
  className,
  subSidebarItems,
  subSidebarHidden = false,
  onToggleSubSidebar,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  subSidebarItems: SubSidebarMenuItem | null;
  /** Whether the sub-sidebar is currently collapsed away. */
  subSidebarHidden?: boolean;
  onToggleSubSidebar: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolved once for the whole group: an entry carrying a query string
  // and its bare-path sibling can both match the path, and only the more
  // specific one should light up.
  // Flattened, so a nested screen can win. Matching only the top level
  // meant opening one lit its parent's sibling — or nothing at all.
  const subNavSearch = searchParams?.toString() ?? "";
  const activeSubNavUrl = activeNavUrl(
    flattenMenuItems(subSidebarItems?.items ?? []),
    pathname,
    subNavSearch,
  );
  const { data: session } = useSession();
  // Company admins (is_staff) get the admin nav (company settings + staff mgmt).

  // One ordered list, filtered rather than concatenated — an admin-only
  // entry keeps its place in the order instead of being pushed to the end.
  const isStaff = Boolean(session?.user?.is_staff);
  const navMain = sidebarMenus.nav.filter((item) => !item.adminOnly || isStaff);

  return (
    <Sidebar
      collapsible="icon"
      // Clipping lives on the inner element, not the container: the hide
      // button is positioned against the container and deliberately hangs
      // over its right edge, so clipping there cuts it in half.
      className={cn(
        "*:data-[sidebar=sidebar]:flex-row *:data-[sidebar=sidebar]:overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* Collapses the sub-sidebar, never the rail. The rail is 3.5rem of
          icons and the app's only navigation, so hiding it would cost the
          user their way around for almost no room; the sub-sidebar's 14rem
          is the width actually worth reclaiming. It stays on the rail, so
          bringing the menu back needs no separate control elsewhere. */}
      {subSidebarItems && (
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={onToggleSubSidebar}
          aria-label={
            subSidebarHidden
              ? `Show ${subSidebarItems.title} menu`
              : `Hide ${subSidebarItems.title} menu`
          }
          className="absolute top-2 -right-3 z-20 rounded-full bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
        >
          {subSidebarHidden ? (
            <IconLayoutSidebarLeftExpand className="size-4" />
          ) : (
            <IconLayoutSidebar className="size-4" />
          )}
        </Button>
      )}
      <Sidebar collapsible="none" className="w-14.25! border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="StoreSignal AI"
                className="h-auto p-0!"
              >
                <Link href="/">
                  <Image
                    className="size-8 object-contain"
                    src="https://storesignal.ai/wp-content/uploads/2026/01/cropped-logo-mark-final-192x192.png"
                    alt="StoreSignal AI"
                    width={32}
                    height={32}
                    loading="eager"
                  />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <StoreSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navMain} />
          {sidebarMenus.navSecondary && (
            <NavSecondary
              items={sidebarMenus.navSecondary}
              className="mt-auto"
            />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      {subSidebarItems && !subSidebarHidden && (
        <Sidebar collapsible="none" className="flex-1">
          {/* h-16, matching every panel header to its right, so the rules
              across the top of the app are one continuous line. */}
          <SidebarHeader className="h-16 shrink-0 justify-center border-b px-4 py-0">
            <div className="flex w-full items-center">
              {subSidebarItems.icon && (
                <subSidebarItems.icon className="mr-2 size-5" />
              )}
              <CardTitle>{subSidebarItems.title}</CardTitle>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                  {subSidebarItems.items.map((item) => {
                    if (item.items && item.items?.length > 0) {
                      return (
                        <CollapsibleMenuItem
                          key={item.title}
                          pathname={pathname}
                          title={item.title}
                          icon={item.icon}
                          // Open when anything inside is the current
                          // screen — the parent is a heading, not a link,
                          // so it is never the active url itself.
                          defaultOpen={isBranchActive(
                            item,
                            pathname,
                            subNavSearch,
                          )}
                          items={item.items}
                        />
                      );
                    }
                    return (
                      <SidebarMenuItemWrapper
                        key={item.title}
                        item={item}
                        pathname={pathname}
                        isActive={item.url === activeSubNavUrl}
                        expanded
                      />
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </Sidebar>
  );
}
