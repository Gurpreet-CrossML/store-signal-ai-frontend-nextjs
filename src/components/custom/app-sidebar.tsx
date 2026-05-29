"use client"

import * as React from "react"

import { NavMain } from "@/components/custom/nav-main"
import { NavSecondary } from "@/components/custom/nav-secondary"
import { NavUser } from "@/components/custom/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { sidebarMenus } from "@/lib/sidebar-navs"
import Image from "next/image"
import Link from "next/link"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <NavMain items={sidebarMenus.navMain} />
                <NavSecondary items={sidebarMenus.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
