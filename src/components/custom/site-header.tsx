"use client";

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { sidebarMenus } from "@/lib/sidebar-navs";

export function SiteHeader() {

    const pathname = usePathname();
    const mainNav = sidebarMenus.navMain;

    function findTitleFromPath(pathname: string | null) {
        const found = mainNav.find((item) => item.url === pathname);
        return found ? found.title : pathname;
    }

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-base font-medium">{findTitleFromPath(pathname)}</h1>
            </div>
        </header>
    )
}
