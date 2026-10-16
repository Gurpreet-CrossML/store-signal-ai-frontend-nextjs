"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IconLock } from "@tabler/icons-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { can } from "@/lib/access-rules";
import { firstVisibleNavUrl } from "@/lib/sidebar-navs";
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

  return (
    <div className="p-4">
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia>
            <IconLock />
          </EmptyMedia>
          <EmptyTitle>No Access</EmptyTitle>
          <EmptyDescription>
            Your role doesn&apos;t include this page. Ask your company admin if
            you need it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
