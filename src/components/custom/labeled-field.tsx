"use client";

import type { ReactNode } from "react";
import { type Icon } from "@tabler/icons-react";
import { Label } from "@/components/ui/label";

type LabeledFieldProps = {
  htmlFor?: string;
  label: ReactNode;
  icon?: Icon;
  badge?: string;
  hint?: string;
  children: ReactNode;
};

export default function LabeledField({
  htmlFor,
  label,
  icon: IconComponent,
  badge,
  hint,
  children,
}: LabeledFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-2">
        {IconComponent && <IconComponent className="size-4" />}
        {label}
        {badge && (
          <span className="text-xs font-normal text-muted-foreground">
            {badge}
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
