"use client";

import SettingsAdminGate from "@/components/custom/settings/settings-admin-gate";
import SubPageShell from "@/components/custom/sub-page-shell";

/**
 * Shell for /settings/* subpages: the shared sub-page shell wrapped in the
 * company-admin gate.
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
      <SubPageShell
        backHref="/settings"
        backLabel="Back to settings"
        title={title}
        description={description}
      >
        {children}
      </SubPageShell>
    </SettingsAdminGate>
  );
}
