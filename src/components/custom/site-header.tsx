"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { findMenuItemByUrl, sidebarMenus } from "@/lib/sidebar-navs";
import { useSession } from "next-auth/react";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Company admins (is_staff) get the admin nav (company settings + staff mgmt).
  const navMain = session?.user?.is_staff
    ? [...sidebarMenus.navMain, ...sidebarMenus.navAdmin]
    : sidebarMenus.navMain;

  // Routes that aren't in the nav (e.g. /settings/general) fall back to a
  // humanized last path segment: "staff-management" → "Staff Management".
  const fallbackTitle = (pathname ?? "")
    .split("/")
    .filter(Boolean)
    .pop()
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const title = findMenuItemByUrl(navMain, pathname)?.title ?? fallbackTitle;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2" />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  );
}
