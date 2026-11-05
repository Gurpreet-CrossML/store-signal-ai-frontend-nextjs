"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IconChevronDown, IconMenu2 } from "@tabler/icons-react";

import { HelpdeskNavPanel } from "@/components/custom/helpdesk/helpdesk-nav-panel";
import { NavUser } from "@/components/custom/nav-user";
import { NotificationBell } from "@/components/custom/notification-bell";
import { DashboardSetupChecklist } from "@/components/custom/dashboard-setup-checklist";
import { StoreSwitcher } from "@/components/custom/store-switcher";
import { SubSidebarList } from "@/components/custom/sub-sidebar-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
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
import { useHelpdeskSidebar } from "@/hooks/use-helpdesk-sidebar";
import {
  activeNavUrl,
  findMenuSectionByPath,
  flattenMenuItems,
  isMenuItemActive,
  sidebarMenus,
  type MainSidebarMenuItem,
} from "@/lib/sidebar-navs";
import { cn } from "@/lib/utils";

const LOGO_SRC =
  "https://storesignal.ai/wp-content/uploads/2026/01/cropped-logo-mark-final-192x192.png";

/**
 * The bar across the top of a phone screen, with the button that opens the
 * navigation drawer. Phone only (below `md`, the width at which the docked
 * sidebar takes over); everything wider has the sidebar and no bar.
 *
 * Sticky, so the menu stays one tap away on a long page. Its height is the
 * `--app-topbar-height` variable, which the full-viewport screens subtract
 * from their own height (see `h-app-screen` in globals.css).
 */
export function MobileTopBar({ pathname }: { pathname: string | null }) {
  const { setOpenMobile } = useSidebar();
  const section = findMenuSectionByPath(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-(--app-topbar-height) shrink-0 items-center gap-3 border-b bg-background px-3 md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open navigation menu"
        onClick={() => setOpenMobile(true)}
      >
        <IconMenu2 className="size-5" />
      </Button>
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <Image
          className="size-7 shrink-0 object-contain"
          src={LOGO_SRC}
          alt="StoreSignal AI"
          width={28}
          height={28}
          loading="eager"
        />
        {section && (
          <span className="truncate text-base font-semibold tracking-tight">
            {section.title}
          </span>
        )}
      </Link>
    </header>
  );
}

/**
 * An area's pages, nested under its row in the drawer.
 *
 * Reads its own menu rather than being handed the current area's, because
 * any area can be opened here, not just the one the route is in. The help
 * desk's views come with their ticket counts, fetched by the hook.
 */
function AreaSubMenu({
  areaKey,
  pathname,
  onNavigate,
}: {
  areaKey: string;
  pathname: string | null;
  onNavigate: () => void;
}) {
  const search = useSearchParams()?.toString() ?? "";
  const staticMenu = sidebarMenus.navSubSidebar?.[areaKey] ?? null;
  const menu = useHelpdeskSidebar(staticMenu);
  const isHelpdesk =
    staticMenu !== null && staticMenu === sidebarMenus.navSubSidebar?.helpdesk;

  if (!menu) return null;

  const activeUrl = activeNavUrl(
    flattenMenuItems(menu.items),
    pathname,
    search,
  );

  return (
    // Any link inside is a destination. Bubble phase, deliberately: closing
    // in capture would unmount the link before its client-side navigation
    // ran.
    <div
      className="mt-1 mb-2 ml-4 border-l pl-2"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) onNavigate();
      }}
    >
      {isHelpdesk ? (
        <HelpdeskNavPanel />
      ) : (
        <div className="flex flex-col gap-2">
          <SubSidebarList
            menu={menu}
            pathname={pathname}
            search={search}
            activeUrl={activeUrl}
          />
        </div>
      )}
    </div>
  );
}

/**
 * The drawer's menu: every main-nav entry with its label. An entry with
 * pages of its own is an accordion row — tapping it opens or closes its
 * list, and opening one closes the one that was open. A plain entry is a
 * link and closes the drawer.
 *
 * Its own component so the open row starts as the current area each time
 * the drawer opens: the sheet unmounts its content when closed.
 */
function DrawerMenu({
  navItems,
  pathname,
  currentAreaKey,
  liveSupportBadgeCount,
  onNavigate,
}: {
  navItems: MainSidebarMenuItem[];
  pathname: string | null;
  currentAreaKey: string | null;
  liveSupportBadgeCount: number;
  onNavigate: () => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(currentAreaKey);

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const active = isMenuItemActive(
          pathname,
          item.activeBasePath ?? item.url,
        );
        const areaKey = item.subSidebarKey;
        const isOpen = areaKey !== undefined && areaKey === openKey;
        const badge = item.url === "/support" ? liveSupportBadgeCount : 0;
        const buttonClass =
          "h-10 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:hover:text-primary";
        const content = (
          <>
            <item.icon className={cn(active && "text-primary!")} />
            <span className="flex-1 truncate text-left">{item.title}</span>
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] leading-none font-semibold text-white">
                {badge}
              </span>
            )}
            {areaKey !== undefined && (
              <IconChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  !isOpen && "-rotate-90",
                )}
              />
            )}
          </>
        );

        return (
          <SidebarMenuItem key={item.title}>
            {areaKey !== undefined ? (
              <SidebarMenuButton
                isActive={active}
                aria-expanded={isOpen}
                className={buttonClass}
                onClick={() => setOpenKey(isOpen ? null : areaKey)}
              >
                {content}
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={active}
                className={buttonClass}
              >
                <Link href={item.url} onClick={onNavigate}>
                  {content}
                </Link>
              </SidebarMenuButton>
            )}
            {isOpen && areaKey !== undefined && (
              <AreaSubMenu
                areaKey={areaKey}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

/**
 * The navigation drawer for phones, opened from the top bar's button.
 *
 * The docked layout is two panes — an icon rail and an area's sub-sidebar.
 * Neither fits a phone, so they become one column (see `DrawerMenu`).
 */
export function MobileNavDrawer({
  navItems,
  pathname,
  currentAreaKey,
  liveSupportBadgeCount,
}: {
  navItems: MainSidebarMenuItem[];
  pathname: string | null;
  /** The area the current route belongs to, if it has a sub-sidebar. */
  currentAreaKey: string | null;
  liveSupportBadgeCount: number;
}) {
  const { openMobile, setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent
        side="left"
        showCloseButton={false}
        data-sidebar="sidebar"
        data-mobile="true"
        className="w-[min(20rem,88vw)] gap-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:sm:max-w-none"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Main menu and the open section&apos;s pages.
          </SheetDescription>
        </SheetHeader>

        <SidebarHeader className="border-b p-3">
          <StoreSwitcher />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <DrawerMenu
                navItems={navItems}
                pathname={pathname}
                currentAreaKey={currentAreaKey}
                liveSupportBadgeCount={liveSupportBadgeCount}
                onNavigate={close}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <SidebarMenu className="flex-row items-center gap-2">
            <SidebarMenuItem>
              <DashboardSetupChecklist />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NotificationBell />
            </SidebarMenuItem>
          </SidebarMenu>
          <NavUser />
        </SidebarFooter>
      </SheetContent>
    </Sheet>
  );
}
