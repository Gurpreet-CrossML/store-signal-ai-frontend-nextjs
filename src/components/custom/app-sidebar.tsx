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
import { useAppSelector } from "@/redux/hooks";
import { axiosInstance } from "@/redux/axios-config";
import { ENDPOINTS } from "@/lib/config";

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
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const [needsHumanBadge, setNeedsHumanBadge] = React.useState({
    storeCode: "",
    count: 0,
  });
  const dashboardWsRef = React.useRef<WebSocket | null>(null);

  const refreshNeedsHumanBadge = React.useCallback(() => {
    if (!storeCode) {
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      store_code: storeCode,
      is_active: "true",
      need_escalation: "true",
      page: "1",
      page_size: "1",
    });

    axiosInstance
      .get(`${ENDPOINTS.fetchThreads()}?${params.toString()}`)
      .then((response) => {
        if (cancelled) return;

        const data = response.data?.data;
        setNeedsHumanBadge({
          storeCode,
          count: Array.isArray(data) ? 0 : Number(data?.count ?? 0),
        });
      })
      .catch(() => {
        if (!cancelled) setNeedsHumanBadge({ storeCode, count: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [storeCode]);

  React.useEffect(() => refreshNeedsHumanBadge(), [refreshNeedsHumanBadge]);

  React.useEffect(() => {
    const token = session?.user?.access_token;
    if (!token || !storeCode) {
      dashboardWsRef.current?.close();
      dashboardWsRef.current = null;
      return;
    }

    const dashboardWs = new WebSocket(
      ENDPOINTS.dashboardSocket(storeCode, token),
    );
    dashboardWsRef.current = dashboardWs;

    dashboardWs.onmessage = (event) => {
      let data: { success?: boolean; action_type?: string };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (
        data?.success &&
        ["message", "thread_updated", "thread_closed"].includes(
          data.action_type ?? "",
        )
      ) {
        refreshNeedsHumanBadge();
      }
    };

    dashboardWs.onclose = () => {
      if (dashboardWsRef.current === dashboardWs) {
        dashboardWsRef.current = null;
      }
    };

    dashboardWs.onerror = () => {};

    return () => {
      dashboardWs.close();
      if (dashboardWsRef.current === dashboardWs) {
        dashboardWsRef.current = null;
      }
    };
  }, [session?.user?.access_token, storeCode, refreshNeedsHumanBadge]);

  // One ordered list, filtered rather than concatenated — a hidden entry
  // leaves the rest in their order. Admins see everything; staff see what
  // their role allows.
  const navMain = sidebarMenus.nav.filter((item) =>
    isNavItemVisible(item, session?.user),
  );

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
            liveSupportBadgeCount={
              needsHumanBadge.storeCode === storeCode
                ? needsHumanBadge.count
                : 0
            }
          />
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
        <Sidebar collapsible="none" className="min-w-0 flex-1">
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
                {subSidebarItems.action && <subSidebarItems.action />}
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
