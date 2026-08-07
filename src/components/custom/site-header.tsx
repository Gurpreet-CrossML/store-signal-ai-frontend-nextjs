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
  // humanized path segment: "staff-management" → "Staff Management".
  // Id-looking segments (uuids, numeric ids) are skipped so detail pages
  // titled by their parent ("/threads/<uuid>" → "Threads"), and words with
  // their own casing (acronyms) are mapped explicitly.
  const specialWords: Record<string, string> = { ai: "AI", faqs: "FAQs" };
  const looksLikeId = (segment: string) =>
    /^[0-9a-f-]{16,}$/i.test(segment) || /^\d+$/.test(segment);
  const fallbackTitle = (pathname ?? "")
    .split("/")
    .filter((segment) => segment && !looksLikeId(segment))
    .pop()
    ?.split("-")
    .map(
      (word) =>
        specialWords[word] ?? word.charAt(0).toUpperCase() + word.slice(1),
    )
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
