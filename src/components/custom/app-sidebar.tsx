"use client";

import * as React from "react";

import { NavMain } from "@/components/custom/nav-main";
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
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! h-fit"
            >
              <Link href="/">
                <Image
                  src="https://storesignal.ai/wp-content/uploads/2026/01/final-logo-dark-1.svg"
                  alt="StoreSignal AI"
                  width={250}
                  height={20}
                  loading="eager"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={sidebarMenus.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
