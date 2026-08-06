"use client";

import Link from "next/link";
import {
  IconBrandMeta,
  IconBuildingSkyscraper,
  IconChevronRight,
  IconPlugConnected,
  IconUsers,
} from "@tabler/icons-react";

import SettingsAdminGate from "@/components/custom/settings/settings-admin-gate";
import { Typography } from "@/components/ui/typography";

const SETTINGS_SECTIONS = [
  {
    href: "/settings/general",
    title: "General",
    description: "Company profile — name, logo, and identity details.",
    icon: IconBuildingSkyscraper,
  },
  {
    href: "/settings/staff-management",
    title: "Staff Management",
    description: "Invite teammates and control who has access.",
    icon: IconUsers,
  },
  {
    href: "/settings/integrations",
    title: "Integrations",
    description: "Connect your store and third-party platforms.",
    icon: IconPlugConnected,
  },
  {
    href: "/settings/social-ai",
    title: "Social AI",
    description:
      "Facebook and Instagram accounts connected to Store Signal AI.",
    icon: IconBrandMeta,
  },
];

export default function Settings() {
  return (
    <SettingsAdminGate>
      <div className="flex flex-col gap-6 p-4">
        <div>
          <Typography variant="h4" as="h2">
            Settings
          </Typography>
          <Typography variant="muted">
            Manage your company, team, and connected platforms.
          </Typography>
        </div>

        <nav aria-label="Settings sections" className="flex flex-col gap-3">
          {SETTINGS_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <section.icon className="size-5" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Typography variant="h6" as="h3">
                  {section.title}
                </Typography>
                <Typography variant="muted" className="truncate">
                  {section.description}
                </Typography>
              </div>
              <IconChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>
      </div>
    </SettingsAdminGate>
  );
}
