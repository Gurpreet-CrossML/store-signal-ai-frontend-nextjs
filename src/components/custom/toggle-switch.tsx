"use client";

import { IconCheck, IconX } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

type ToggleSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

export function ToggleSwitch({
  checked,
  disabled,
  label,
  onCheckedChange,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        onCheckedChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-8 w-14 items-center rounded-full border transition-colors duration-200",
        checked
          ? "border-emerald-600/50 bg-emerald-600/30"
          : "border-border bg-muted/60",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      >
        {checked ? (
          <IconCheck className="size-3.5 text-emerald-600" />
        ) : (
          <IconX className="size-3.5 text-muted-foreground" />
        )}
      </span>
    </button>
  );
}
