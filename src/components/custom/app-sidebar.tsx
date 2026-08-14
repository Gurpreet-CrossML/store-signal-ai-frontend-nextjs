"use client";

import * as React from "react";

import { NavMain, SidebarMenuItemWrapper } from "@/components/custom/nav-main";
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
  sidebarMenus,
  SubSidebarMenuItem,
} from "@/lib/sidebar-navs";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { IconLayoutSidebar } from "@tabler/icons-react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function AppSidebar({
  className,
  subSidebarItems,
  onHide,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  subSidebarItems: SubSidebarMenuItem | null;
  onHide: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolved once for the whole group: an entry carrying a query string
  // and its bare-path sibling can both match the path, and only the more
  // specific one should light up.
  const activeSubNavUrl = activeNavUrl(
    subSidebarItems?.items ?? [],
    pathname,
    searchParams?.toString() ?? "",
  );
  const { data: session } = useSession();
  // Company admins (is_staff) get the admin nav (company settings + staff mgmt).

  const navMain = session?.user?.is_staff
    ? [...sidebarMenus.navMain, ...sidebarMenus.navAdmin]
    : sidebarMenus.navMain;

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
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onClick={onHide}
        aria-label="Hide sidebar"
        className="absolute top-2 -right-3 z-20 rounded-full bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
      >
        <IconLayoutSidebar className="size-4" />
      </Button>
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
      {subSidebarItems && (
        <Sidebar collapsible="none" className="flex-1">
          <SidebarHeader className="gap-3.5 border-b p-4">
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
                  {subSidebarItems.items.map((item) => (
                    <SidebarMenuItemWrapper
                      key={item.title}
                      item={item}
                      pathname={pathname}
                      isActive={item.url === activeSubNavUrl}
                      expanded
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </Sidebar>
  );
}
