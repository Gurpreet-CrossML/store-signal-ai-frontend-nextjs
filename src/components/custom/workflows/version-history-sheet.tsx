"use client";

import { IconArrowBackUp, IconFileCode } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { formatDateTime } from "@/lib/helpers";
import type { PromptVersion, PromptVersionAction } from "@/lib/workflows";

const ACTION: Record<PromptVersionAction, { label: string; tone: BadgeTone }> =
  {
    publish: { label: "Published", tone: "accent" },
    restore: { label: "Restored to draft", tone: "info" },
    enable: { label: "Turned on", tone: "success" },
    disable: { label: "Turned off", tone: "neutral" },
  };

/**
 * Every change to the workflow, newest first — the snapshots kept in the
 * config's `metadata.versions`. Restoring copies a published prompt into
 * the draft; it goes live only when published again.
 */
export function VersionHistorySheet({
  open,
  onOpenChange,
  versions,
  publishedVersion,
  sourceFile,
  isRestoring,
  onRestore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: PromptVersion[];
  publishedVersion: number;
  sourceFile: string;
  isRestoring: boolean;
  onRestore: (version: number | "default") => void;
}) {
  const newestFirst = [...versions].reverse();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>
            Every publish, restore and on/off change. Restoring loads a version
            into the draft.
          </SheetDescription>
        </SheetHeader>

        <ol className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {newestFirst.map((entry) => {
            const action = ACTION[entry.action];
            const isLive =
              entry.action === "publish" &&
              entry.published_version === publishedVersion;
            return (
              <li
                key={entry.version}
                className="flex flex-col gap-1.5 border-b px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    #{entry.version}
                  </span>
                  <Badge
                    variant="outline"
                    className={BADGE_TONE_STYLES[action.tone]}
                  >
                    {action.label}
                    {entry.action === "publish" &&
                      ` v${entry.published_version}`}
                  </Badge>
                  {isLive && (
                    <Badge
                      variant="outline"
                      className={BADGE_TONE_STYLES.success}
                    >
                      Live
                    </Badge>
                  )}
                  <span className="flex-1" />
                  {entry.action === "publish" && !isLive && (
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={isRestoring}
                      onClick={() => onRestore(entry.version)}
                    >
                      <IconArrowBackUp />
                      Restore
                    </Button>
                  )}
                </div>
                {entry.note && <p className="text-sm">{entry.note}</p>}
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(entry.created_at)}
                </span>
              </li>
            );
          })}

          <li className="flex flex-col gap-1.5 px-4 py-3">
            <div className="flex items-center gap-2">
              <IconFileCode className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Default prompt</span>
              <span className="flex-1" />
              <Button
                variant="outline"
                size="xs"
                disabled={isRestoring}
                onClick={() => onRestore("default")}
              >
                <IconArrowBackUp />
                Restore
              </Button>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {sourceFile}
            </span>
          </li>
        </ol>
      </SheetContent>
    </Sheet>
  );
}
