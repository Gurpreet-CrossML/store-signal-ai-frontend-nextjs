"use client";

import { Typography } from "@/components/ui/typography";
import type { KnowledgeItem } from "@/redux/api-slice/knowledge-rag-slice";
import { KnowledgeEntryRow } from "@/components/custom/knowledge/knowledge-entry-row";

/**
 * Manage view for a knowledge group (all entries tied to one product, or all
 * general entries) while editing. Existing data can only be removed here —
 * new knowledge is added from the "Add Knowledge" flow, not from edit.
 */
export function KnowledgeEntriesPanel({
  entries,
  emptyLabel,
}: {
  entries: KnowledgeItem[];
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Typography variant="small" as="p" className="font-medium">
        Added Data
      </Typography>
      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <KnowledgeEntryRow key={entry.id} item={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
