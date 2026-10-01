"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { WorkflowIcon, WorkflowStatusBadge } from "./workflow-card";
import { ConversationRow } from "@/components/custom/conversation-row";
import { LoadingState } from "@/components/custom/loading-state";
import { SearchInput } from "@/components/custom/search-input";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
  matchesSearch,
  WORKFLOWS_HREF,
  type WorkflowSummary,
} from "@/lib/workflows";

/**
 * Every workflow beside the open one, laid out like Help Desk's ticket list
 * so switching between workflows works the way switching tickets does.
 */
export function WorkflowListPanel({
  workflows,
  activeId,
  isLoading,
  onSelect,
}: {
  workflows: WorkflowSummary[];
  activeId: string;
  isLoading: boolean;
  onSelect: (workflowId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const rows = workflows.filter((w) =>
    matchesSearch(query, w.name, w.workflow_id),
  );

  return (
    <section className="hidden h-full min-h-0 w-72 shrink-0 flex-col border-r md:flex 2xl:w-84">
      <header className="flex h-16 shrink-0 items-center gap-1 border-b px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="-ml-2"
          aria-label="Back to all workflows"
          asChild
        >
          <Link href={WORKFLOWS_HREF}>
            <IconArrowLeft />
          </Link>
        </Button>
        <CardTitle>
          Workflows
          <span className="ml-1.5 font-normal text-muted-foreground">
            {workflows.length}
          </span>
        </CardTitle>
      </header>

      <div className="flex h-20 shrink-0 items-center border-b px-4">
        <SearchInput
          className="w-full"
          value={query}
          onChange={setQuery}
          placeholder="Search workflows…"
          label="Search workflows"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
        {isLoading && workflows.length === 0 ? (
          <LoadingState label="Loading workflows…" />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 p-6 text-center">
            <Typography variant="small" as="p">
              No workflows found
            </Typography>
            <Typography variant="muted">Try a different search.</Typography>
          </div>
        ) : (
          rows.map((workflow) => (
            <ConversationRow
              key={workflow.workflow_id}
              active={workflow.workflow_id === activeId}
              onSelect={() => onSelect(workflow.workflow_id)}
              avatar={
                <WorkflowIcon workflow={workflow} className="rounded-full" />
              }
              title={workflow.name}
              titleTooltip={workflow.name}
              timestamp={
                workflow.published_version > 0
                  ? `v${workflow.published_version}`
                  : ""
              }
              preview={workflow.summary}
              footer={<WorkflowStatusBadge workflow={workflow} />}
            />
          ))
        )}
      </div>
    </section>
  );
}
