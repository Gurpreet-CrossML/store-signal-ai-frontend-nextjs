"use client";

import type { ReactNode } from "react";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * The header button, with its label, that opens the usage and details drawer
 * on a tablet or phone where that panel no longer fits beside the page.
 */
export function KnowledgeSettingsButton({
  invalid = false,
  onClick,
}: {
  /** Something in the panel needs fixing; the icon turns red. */
  invalid?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        invalid && "border-destructive text-destructive hover:text-destructive",
      )}
      onClick={onClick}
    >
      <IconAdjustmentsHorizontal className="size-4" />
      Details
    </Button>
  );
}

/**
 * A drawer from the right with the panel that sits beside the page on a
 * desktop: which assistants use the item, where it applies, and its details.
 */
export function KnowledgeSettingsDrawer({
  open,
  onOpenChange,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Usage &amp; details</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
