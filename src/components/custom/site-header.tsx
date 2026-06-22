"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { sidebarMenus } from "@/lib/sidebar-navs";
import { useSession } from "next-auth/react";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Company admins (is_staff) get the admin nav (company settings + staff mgmt).
  const navMain = session?.user?.is_staff
    ? [...sidebarMenus.navMain, ...sidebarMenus.navAdmin]
    : sidebarMenus.navMain;

  function findTitleFromPath(pathname: string | null) {
    const found = navMain.find((item) => item.url === pathname);
    return found ? found.title : pathname;
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2" />
        <h1 className="text-base font-medium">{findTitleFromPath(pathname)}</h1>
      </div>
    </header>
  );
}
