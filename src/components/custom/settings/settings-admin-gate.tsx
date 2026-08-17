"use client";

import { useSession } from "next-auth/react";
import { IconLock } from "@tabler/icons-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * UX gate for company-admin (is_staff) only settings screens. The Django
 * endpoints enforce this server-side too; this just avoids rendering forms
 * the user cannot submit.
 */
export default function SettingsAdminGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "authenticated" && !session?.user?.is_staff) {
    return (
      <div className="p-4">
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia>
              <IconLock />
            </EmptyMedia>
            <EmptyTitle>Admins Only</EmptyTitle>
            <EmptyDescription>
              Company settings and staff management are available to company
              admins only.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return <>{children}</>;
}
