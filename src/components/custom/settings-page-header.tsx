"use client";

import type { ReactNode } from "react";

type SettingsPageHeaderProps = {
  breadcrumb?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export default function SettingsPageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: SettingsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        {breadcrumb && (
          <p className="text-xs text-muted-foreground">{breadcrumb}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
