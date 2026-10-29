import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * An AI action's label with its cost on the next line, so the staff member
 * sees it before clicking. Every billed AI call costs one credit
 * (CREDITS_PER_CALL in the backend's usage app).
 */
export function CreditLabel({
  children,
  className,
}: {
  children: ReactNode;
  // Overrides the cost colour, e.g. on a filled button where red is unreadable.
  className?: string;
}) {
  return (
    // leading-none so both lines fit the button's normal height.
    <span className="flex flex-col items-start gap-0.5 leading-none">
      {children}
      <span className={cn("text-[10px] font-normal text-destructive", className)}>
        1 AI credit
      </span>
    </span>
  );
}
