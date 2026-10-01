"use client";

import Link from "next/link";
import {
  IconChevronRight,
  IconLock,
  IconMessages,
  IconPackage,
  IconReceiptRefund,
  IconRoute,
  IconShoppingBag,
  IconStack2,
  type Icon,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  workflowStatus,
  type WorkflowSummary,
  type WorkflowGroup,
} from "@/lib/workflows";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

export const WORKFLOW_GROUP_ICON: Record<WorkflowGroup, Icon> = {
  orders: IconPackage,
  returns: IconReceiptRefund,
  shopping: IconShoppingBag,
  conversation: IconMessages,
  other: IconRoute,
};

/** The workflow's area icon in a tile; dimmed when the workflow is off. */
export function WorkflowIcon({
  workflow,
  className,
}: {
  workflow: Pick<WorkflowSummary, "group" | "is_enabled">;
  className?: string;
}) {
  const GroupIcon = WORKFLOW_GROUP_ICON[workflow.group];
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg",
        workflow.is_enabled
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <GroupIcon className="size-4" />
    </span>
  );
}

export function WorkflowStatusBadge({
  workflow,
}: {
  workflow: WorkflowSummary;
}) {
  const status = workflowStatus(workflow);
  if (status === "off") {
    return (
      <Badge variant="outline" className={BADGE_TONE_STYLES.neutral}>
        Off
      </Badge>
    );
  }
  if (status === "draft") {
    return (
      <Badge variant="outline" className={BADGE_TONE_STYLES.warning}>
        Unpublished changes
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={BADGE_TONE_STYLES.success}>
      Live
    </Badge>
  );
}

/**
 * One workflow on the Workflows screen. The whole card opens it; the
 * switch turns it on or off in place without opening it.
 */
export function WorkflowCard({
  workflow,
  href,
  isToggling,
  onToggle,
}: {
  workflow: WorkflowSummary;
  href: string;
  isToggling: boolean;
  onToggle: (isEnabled: boolean) => void;
}) {
  const isOff = !workflow.is_enabled;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow]",
        "hover:border-primary/40 hover:shadow-sm",
        "has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50",
      )}
    >
      <div className="flex items-start gap-3">
        <WorkflowIcon workflow={workflow} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Stretched link: the whole card is the click target. */}
          <Link
            href={href}
            className="truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {workflow.name}
          </Link>
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {workflow.workflow_id}
          </span>
        </div>
        <WorkflowStatusBadge workflow={workflow} />
      </div>

      <p
        className={cn(
          "line-clamp-3 min-h-[3.75rem] text-sm leading-5",
          isOff ? "text-muted-foreground/70" : "text-muted-foreground",
        )}
      >
        {workflow.summary}
      </p>

      <div className="mt-auto flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <IconStack2 className="size-3.5" />
          {workflow.steps_count} step{workflow.steps_count === 1 ? "" : "s"}
        </span>
        <span>
          {workflow.published_version > 0
            ? `Customised · v${workflow.published_version}`
            : "Default prompt"}
        </span>
        <span className="flex-1" />

        {/* Above the stretched link, so it toggles instead of opening. */}
        <div className="relative z-10 flex items-center gap-2">
          {workflow.is_required ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1">
                  <IconLock className="size-3.5" />
                  Always on
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>The assistant needs this workflow.</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Switch
              checked={workflow.is_enabled}
              disabled={isToggling}
              onCheckedChange={onToggle}
              aria-label={`${workflow.name} on`}
            />
          )}
        </div>
        <IconChevronRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </article>
  );
}
