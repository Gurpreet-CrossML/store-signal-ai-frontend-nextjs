"use client";

import * as React from "react";

import { NavMain } from "@/components/custom/nav-main";
import { StoreSwitcher } from "@/components/custom/store-switcher";
import { NavSecondary } from "@/components/custom/nav-secondary";
import { NavUser } from "@/components/custom/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarMenus } from "@/lib/sidebar-navs";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  // Company admins (is_staff) get the admin nav (company settings + staff mgmt).
  const navMain = session?.user?.is_staff
    ? [...sidebarMenus.navMain, ...sidebarMenus.navAdmin]
    : sidebarMenus.navMain;
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="StoreSignal AI"
              className="h-auto p-0! group-data-[collapsible=icon]:mx-auto"
            >
              <Link href="/">
                <Image
                  className="group-data-[collapsible=icon]:hidden"
                  src="https://storesignal.ai/wp-content/uploads/2026/01/final-logo-dark-1.svg"
                  alt="StoreSignal AI"
                  width={199}
                  height={32}
                  loading="eager"
                />
                <Image
                  className="hidden size-8 object-contain group-data-[collapsible=icon]:block"
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
          <NavSecondary items={sidebarMenus.navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
