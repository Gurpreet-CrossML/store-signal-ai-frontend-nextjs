"use client";

import { useEffect, useState } from "react";
import { IconRoute } from "@tabler/icons-react";

import { LoadingState } from "@/components/custom/loading-state";
import { SearchInput } from "@/components/custom/search-input";
import { FilterTabs } from "@/components/custom/workflows/filter-tabs";
import { useWorkflowToggle } from "@/components/custom/workflows/use-workflow-toggle";
import {
  WORKFLOW_GROUP_ICON,
  WorkflowCard,
} from "@/components/custom/workflows/workflow-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  matchesSearch,
  WORKFLOW_GROUP_LABEL,
  WORKFLOW_GROUP_ORDER,
  workflowHref,
  workflowStatus,
  type WorkflowStatus,
} from "@/lib/workflows";
import { FetchWorkflows } from "@/redux/api-slice/workflows-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

type Filter = "all" | WorkflowStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "draft", label: "Unpublished" },
  { value: "off", label: "Off" },
];

/** Every workflow of the selected store as cards, grouped by area. */
export default function Workflows() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchWorkflowsListData: workflows,
    FetchWorkflowsIsLoading: isLoading,
  } = useAppSelector((state) => state.GetWorkflowsReducer.FetchWorkflowsState);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const { requestToggle, togglingId, dialog } = useWorkflowToggle();

  useEffect(() => {
    if (storeCode) dispatch(FetchWorkflows(storeCode));
  }, [dispatch, storeCode]);

  const visible = workflows.filter(
    (w) =>
      (filter === "all" || workflowStatus(w) === filter) &&
      matchesSearch(query, w.name, w.workflow_id, w.summary),
  );
  const countFor = (value: Filter) =>
    value === "all"
      ? workflows.length
      : workflows.filter((w) => workflowStatus(w) === value).length;

  if (isLoading && workflows.length === 0) {
    return <LoadingState label="Loading workflows…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search workflows…"
          label="Search workflows"
          className="sm:w-80"
        />
        <FilterTabs
          label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((option) => ({
            ...option,
            count: countFor(option.value),
          }))}
        />
      </div>

      {visible.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconRoute />
            </EmptyMedia>
            <EmptyTitle>No workflows match</EmptyTitle>
            <EmptyDescription>
              Try another search, or show all workflows.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        WORKFLOW_GROUP_ORDER.map((group) => {
          const rows = visible.filter((w) => w.group === group);
          if (rows.length === 0) return null;
          const GroupIcon = WORKFLOW_GROUP_ICON[group];
          return (
            <section key={group} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <GroupIcon className="size-4 text-muted-foreground" />
                {WORKFLOW_GROUP_LABEL[group]}
                <span className="font-normal text-muted-foreground tabular-nums">
                  {rows.length}
                </span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {rows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.workflow_id}
                    workflow={workflow}
                    href={workflowHref(workflow.workflow_id)}
                    isToggling={togglingId === workflow.workflow_id}
                    onToggle={(isEnabled) =>
                      requestToggle({
                        workflowId: workflow.workflow_id,
                        name: workflow.name,
                        isEnabled,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {dialog}
    </div>
  );
}
