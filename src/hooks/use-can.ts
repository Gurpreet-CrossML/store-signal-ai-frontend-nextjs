"use client";

import { useSession } from "next-auth/react";

import { can } from "@/lib/access-rules";
import type { Permission } from "@/lib/tenant-types";

/**
 * May the signed-in user use `permission`? For hiding controls a role cannot
 * use; the server refuses them anyway. False while the session loads.
 */
export function useCan(permission?: Permission, { write = false } = {}) {
  const { data: session } = useSession();
  return can(session?.user, permission, { write });
}
