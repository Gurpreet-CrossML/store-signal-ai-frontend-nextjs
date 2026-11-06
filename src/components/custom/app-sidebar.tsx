"use client";

import * as React from "react";

import { NavMain } from "@/components/custom/nav-main";
import { SubSidebarList } from "@/components/custom/sub-sidebar-menu";
import { MobileNavDrawer } from "@/components/custom/mobile-nav";
import { HelpdeskNavPanel } from "@/components/custom/helpdesk/helpdesk-nav-panel";
import { StoreSwitcher } from "@/components/custom/store-switcher";
import { NavSecondary } from "@/components/custom/nav-secondary";
import { NavUser } from "@/components/custom/nav-user";
import { NotificationBell } from "@/components/custom/notification-bell";
import { DashboardSetupChecklist } from "@/components/custom/dashboard-setup-checklist";
import { useHelpdeskSidebar } from "@/hooks/use-helpdesk-sidebar";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  activeNavUrl,
  flattenMenuItems,
  isNavItemVisible,
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
import { FetchThreadCounts } from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useSupportDashboardEvents } from "@/hooks/use-support-dashboard-events";

// Nothing to subscribe to: only tells hydration apart from later renders.
const noopSubscribe = () => () => {};

export function AppSidebar({
  className,
  subSidebarItems: staticSubSidebarItems,
  subSidebarHidden = false,
  onToggleSubSidebar,
  onSubSidebarNavigate,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  subSidebarItems: SubSidebarMenuItem | null;
  /** Whether the sub-sidebar is currently collapsed away. */
  subSidebarHidden?: boolean;
  onToggleSubSidebar: () => void;
  /** Called when a link inside the sub-sidebar is followed. */
  onSubSidebarNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile } = useSidebar();
  // The help desk's views come with their ticket counts; any other area's
  // sub-sidebar is the static one.
  const subSidebarItems = useHelpdeskSidebar(staticSubSidebarItems);
  // The help desk draws its own panel, with the hide button in its header.
  const isHelpdesk =
    staticSubSidebarItems !== null &&
    staticSubSidebarItems === sidebarMenus.navSubSidebar?.helpdesk;

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
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchThreadCountsData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadCountsState,
  );

  const refreshNeedsHumanBadge = React.useCallback(() => {
    if (!storeCode) {
      return;
    }

    void dispatch(
      FetchThreadCounts({
        store_code: storeCode,
      }),
    );
  }, [dispatch, storeCode]);

  React.useEffect(() => refreshNeedsHumanBadge(), [refreshNeedsHumanBadge]);

  useSupportDashboardEvents((event) => {
    // A personal notification says nothing about the store's chat counts.
    if (event.action_type !== "notification") refreshNeedsHumanBadge();
  });

  // One ordered list, filtered rather than concatenated — a hidden entry
  // leaves the rest in their order. Admins see everything; staff see what
  // their role allows. The server renders without a session, so hydration
  // filters the same way and the user's own entries follow right after.
  const hydrated = React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const navMain = sidebarMenus.nav.filter((item) =>
    isNavItemVisible(item, hydrated ? session?.user : undefined),
  );

  // A phone has no room for the rail and sub-sidebar side by side: one
  // drawer, opened from the top bar, holds both.
  if (isMobile) {
    return (
      <MobileNavDrawer
        navItems={navMain}
        pathname={pathname}
        currentAreaKey={
          staticSubSidebarItems
            ? (Object.entries(sidebarMenus.navSubSidebar ?? {}).find(
                ([, menu]) => menu === staticSubSidebarItems,
              )?.[0] ?? null)
            : null
        }
        liveSupportBadgeCount={FetchThreadCountsData.needsHuman}
      />
    );
  }

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
      {subSidebarItems && !isHelpdesk && (
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
      <Sidebar collapsible="none" className="w-14.25! shrink-0 border-r">
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
          <NavMain
            items={navMain}
            liveSupportBadgeCount={FetchThreadCountsData.needsHuman}
          />
          {sidebarMenus.navSecondary && (
            <NavSecondary
              items={sidebarMenus.navSecondary}
              className="mt-auto"
            />
          )}
        </SidebarContent>
        <SidebarFooter>
          {/* Notifications sit with the user's own controls, on every page
              and for every role (agents cannot open the Dashboard). */}
          <SidebarMenu className="gap-3">
            <SidebarMenuItem>
              <DashboardSetupChecklist />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NotificationBell />
            </SidebarMenuItem>
          </SidebarMenu>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      {subSidebarItems && !subSidebarHidden && (
        <Sidebar
          collapsible="none"
          className="min-w-0 flex-1"
          // Bubble phase, deliberately — not `onClickCapture`. A capture
          // handler runs before the link's own onClick, and closing the menu
          // there unmounts the link first: its client-side navigation never
          // runs and the browser follows the href as a full page load.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) {
              onSubSidebarNavigate?.();
            }
          }}
        >
          {isHelpdesk ? (
            <HelpdeskNavPanel onCollapse={onToggleSubSidebar} />
          ) : (
            <>
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
              {/* This sidebar sits inside one pinned to its icon state, whose
              rules clip the content. Scrolling is switched back on so a long
              list (the help desk's tags) stays reachable. */}
              <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
                <SidebarGroup>
                  <SidebarGroupContent className="flex flex-col gap-2">
                    <SubSidebarList
                      menu={subSidebarItems}
                      pathname={pathname}
                      search={subNavSearch}
                      activeUrl={activeSubNavUrl}
                    />
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </>
          )}
        </Sidebar>
      )}
    </Sidebar>
  );
}
