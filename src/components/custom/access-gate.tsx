"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IconArrowLeft, IconDashboard, IconLock } from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/access-rules";
import { findAreaSection, NAV_AREAS } from "@/lib/nav-areas";
import { firstVisibleNavUrl, sidebarMenus } from "@/lib/sidebar-navs";
import { ROLE_LABELS } from "@/lib/staff-roles";
import type { Permission } from "@/lib/tenant-types";

/**
 * Shows its page only to a role that may read `permission` (no permission =
 * company admins only). Django and the Next.js data routes enforce the same
 * rule; this just avoids rendering a screen whose every call would be refused.
 *
 * Nothing renders while the session loads, so a locked page never starts
 * fetching. With `redirect`, a user who may not see the page is sent to the
 * first screen their role can open — used for "/", where everyone lands.
 */
export function AccessGate({
  permission,
  redirect = false,
  children,
}: {
  permission?: Permission;
  redirect?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const allowed = status === "authenticated" && can(user, permission);
  // While onboarding is pending the proxy pins everyone to "/", so leaving
  // would bounce straight back.
  const target =
    redirect &&
    status === "authenticated" &&
    !allowed &&
    !user?.onboarding_pending
      ? firstVisibleNavUrl(user)
      : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (status === "loading" || target) return null;
  if (allowed) return <>{children}</>;

  return <AccessDenied />;
}

/**
 * The page's name for the "no access" message: a screen inside an area
 * first, then the area, then a main-nav entry (Live Support, Threads...).
 *
 * Args:
 *   pathname: The route the user tried to open.
 *
 * Returns:
 *   The name, or null for a route no menu names.
 */
function deniedPageName(pathname: string): string | null {
  // An area's own address names the area (Help Desk), even when its first
  // screen shares that address (All Inboxes).
  const areaRoot = Object.values(NAV_AREAS).find(
    (entry) => entry.href === pathname,
  );
  if (areaRoot) return areaRoot.title;
  const section = findAreaSection(pathname)?.section.title;
  if (section) return section;
  const area = Object.values(NAV_AREAS).find((entry) =>
    pathname.startsWith(entry.href),
  );
  if (area) return area.title;
  const navEntry = sidebarMenus.nav.find(
    (entry) => entry.url !== "/" && pathname.startsWith(entry.url),
  );
  return navEntry?.title ?? null;
}

/** Up to two initials from a name, else the email's first letter. */
function initialsOf(name?: string | null, email?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

/**
 * The screen a role sees on a page it may not open (design: StoreSignal
 * Design System › Access denied — desktop, iPad and mobile). Says which page,
 * offers a way out, and shows who is signed in with which role.
 */
function AccessDenied() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const user = session?.user;
  const pageName = deniedPageName(pathname);
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : null;

  // A page opened in a new tab has nothing to go back to.
  const goBack = () =>
    window.history.length > 1 ? router.back() : router.push("/");

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 pt-6 pb-12 sm:min-h-[70vh] sm:justify-center sm:pt-12">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-7 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-primary/5 sm:size-30">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-22">
            <IconLock className="size-6 text-primary sm:size-8" aria-hidden />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2.5">
          <p className="text-xs leading-4 font-semibold tracking-[0.6px] text-primary uppercase">
            Access denied
          </p>
          <h1 className="text-[22px] leading-[30px] font-semibold tracking-[-0.5px] text-foreground sm:text-3xl sm:leading-[38px]">
            You don&apos;t have access to this page
          </h1>
          <p className="text-sm leading-[22px] text-muted-foreground sm:text-[15px]">
            Your role doesn&apos;t include access to{" "}
            <span className="font-semibold text-foreground">
              {pageName ?? "this page"}
            </span>
            .
          </p>
        </div>

        {/* Stacked full width on a phone, side by side from tablet up. */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              <IconDashboard data-icon="inline-start" />
              Go to dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={goBack}
          >
            <IconArrowLeft data-icon="inline-start" />
            Go back
          </Button>
        </div>

        {user?.email && (
          <div className="flex max-w-full items-center gap-2 rounded-full border bg-background py-1.5 pr-2 pl-1.5 text-xs text-muted-foreground">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initialsOf(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 truncate">
              Signed in as{" "}
              <span className="font-semibold text-foreground">
                {user.email}
              </span>
            </span>
            {roleLabel && (
              <Badge variant="secondary" className="shrink-0">
                {roleLabel}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
