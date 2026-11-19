"use client";

import { useSession } from "next-auth/react";

import type { StaffRole } from "@/lib/tenant-types";

const NONE: StaffRole[] = [];

/**
 * The staff roles the signed-in user may give, and so the staff they may
 * change, as Django computed it. Empty while the session loads.
 */
export function useManagedRoles(): StaffRole[] {
  const { data: session } = useSession();
  return session?.user?.managed_roles ?? NONE;
}
