"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import type { NavAreaKey } from "@/lib/nav-areas";
import { firstAreaUrl } from "@/lib/sidebar-navs";

/**
 * An area's own address (/settings, /crm, ...) has no menu page: the user is
 * sent to the area's first screen they may open, so they never see the side
 * menu and the same list of screens twice.
 */
export function AreaRedirect({ area }: { area: NavAreaKey }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    const target = firstAreaUrl(area, session?.user);
    if (target) router.replace(target);
  }, [area, router, session?.user, status]);

  return null;
}
