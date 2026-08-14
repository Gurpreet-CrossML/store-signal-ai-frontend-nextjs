"use client";

import { IconSearch, IconX } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The search box every list uses.
 *
 * There were two of these: an icon-and-clear version on the table screens
 * and a bare SidebarInput on the panel screens, one of them a pill and the
 * rest not. Same job, six copies, three shapes.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name — the field has no visible label. */
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pl-9"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <IconX className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
