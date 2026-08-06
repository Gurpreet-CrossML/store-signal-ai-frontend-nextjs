"use client";

import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import SettingsAdminGate from "@/components/custom/settings/settings-admin-gate";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

/**
 * Shared shell for /settings/* subpages: admin gate, back navigation to the
 * settings menu, and a consistent page header.
 */
export default function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <SettingsAdminGate>
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            aria-label="Back to settings"
          >
            <Link href="/settings">
              <IconArrowLeft />
            </Link>
          </Button>
          <div>
            <Typography variant="h4" as="h2">
              {title}
            </Typography>
            <Typography variant="muted">{description}</Typography>
          </div>
        </div>
        {children}
      </div>
    </SettingsAdminGate>
  );
}
