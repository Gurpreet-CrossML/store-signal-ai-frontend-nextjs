"use client";

import {
  IconBrandMeta,
  IconBuildingSkyscraper,
  IconPlugConnected,
  IconUsers,
} from "@tabler/icons-react";

import { PageHeading } from "@/components/custom/page-heading";
import SettingsAdminGate from "@/components/custom/settings/settings-admin-gate";
import {
  SectionNav,
  type SectionNavItem,
} from "@/components/custom/section-nav";

const SETTINGS_SECTIONS: SectionNavItem[] = [
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
        <PageHeading
          title="Settings"
          description="Manage your company, team, and connected platforms."
        />
        <SectionNav items={SETTINGS_SECTIONS} ariaLabel="Settings sections" />
      </div>
    </SettingsAdminGate>
  );
}
