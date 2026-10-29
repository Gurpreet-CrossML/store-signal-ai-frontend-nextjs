"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  IconAutomaticGearbox,
  IconFileText,
  IconLock,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { DataTable } from "@/components/custom/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchStoreWorkflows,
  UpdateStoreWorkflow,
  type StoreWorkflow,
} from "@/redux/api-slice/store-settings-slice";

/** Shown in a cell that has nothing to say. */
const EMPTY_CELL = <Typography variant="muted">—</Typography>;

/**
 * One row per platform workflow: what it is, its tags, what it depends on,
 * a link to its policy page and the on/off switch.
 */
function getColumns(
  pendingCode: string | null,
  onToggle: (workflow: StoreWorkflow, isEnabled: boolean) => void,
): ColumnDef<StoreWorkflow>[] {
  return [
    {
      accessorKey: "name",
      header: "Workflow",
      cell: ({ row }) => {
        const workflow = row.original;
        return (
          <div className="flex min-w-64 items-center gap-3 py-1">
            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
              {workflow.icon ? (
                // Plain <img>: the icon is a temporary S3 URL, not a static asset.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={workflow.icon}
                  alt=""
                  className="size-5 object-contain"
                />
              ) : (
                <IconAutomaticGearbox className="size-4" />
              )}
            </div>
            <div className="flex max-w-md min-w-0 flex-col gap-0.5 whitespace-normal">
              <span className="font-medium">{workflow.name}</span>
              <Typography variant="muted" className="line-clamp-2 text-xs">
                {workflow.description}
              </Typography>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) =>
        row.original.tags.length ? (
          <div className="flex max-w-56 flex-wrap gap-1.5">
            {row.original.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          EMPTY_CELL
        ),
    },
    {
      id: "needs",
      header: "Needs",
      cell: ({ row }) => {
        const workflow = row.original;
        // What the workflow depends on, shown so a store knows why it may not work.
        const needs = [
          workflow.shopify_supported && "Shopify",
          workflow.magento_supported && "Magento",
          workflow.kb_supported && "Knowledge base",
        ].filter(Boolean) as string[];
        return needs.length ? (
          <span className="text-sm text-muted-foreground">
            {needs.join(" · ")}
          </span>
        ) : (
          EMPTY_CELL
        );
      },
    },
    {
      id: "policy",
      header: "Policy",
      cell: ({ row }) => {
        const workflow = row.original;
        if (!workflow.has_policy) return EMPTY_CELL;
        return (
          <Button variant="outline" size="xs" asChild>
            <Link href={`/settings/workflows/${workflow.code}/policy`}>
              <IconFileText data-icon="inline-start" />
              Policy
              {workflow.policy_version > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5">
                  v{workflow.policy_version}
                </Badge>
              )}
            </Link>
          </Button>
        );
      },
    },
    {
      accessorKey: "is_enabled",
      header: "On",
      cell: ({ row }) => {
        const workflow = row.original;
        // Locked workflows show a lock: the backend refuses to turn them off.
        if (!workflow.can_disable)
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconLock className="size-4" />
                  Always on
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Core to Store Signal, so it can&apos;t be turned off.
              </TooltipContent>
            </Tooltip>
          );
        return (
          <Switch
            checked={workflow.is_enabled}
            disabled={pendingCode === workflow.code}
            onCheckedChange={(isEnabled) => onToggle(workflow, isEnabled)}
            aria-label={`Turn ${workflow.name} ${workflow.is_enabled ? "off" : "on"}`}
          />
        );
      },
    },
  ];
}

/**
 * Settings → Workflows: a table with one row per platform workflow and an
 * on/off switch for the selected store. The list is the same for every
 * company; a switch only changes this store. A workflow that takes the
 * store's own policy links to its policy page.
 */
export default function SettingsWorkflows() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const { FetchStoreWorkflowsData, FetchStoreWorkflowsIsLoading } =
    useAppSelector(
      (state) => state.GetStoreSettingsReducer.FetchStoreWorkflowsState,
    );
  const pendingCode = useAppSelector(
    (state) =>
      state.GetStoreSettingsReducer.UpdateStoreWorkflowState
        .UpdateStoreWorkflowPendingCode,
  );

  // The whole list comes in one response; the table pages it here.
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const pageRows = FetchStoreWorkflowsData.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize,
  );

  useEffect(() => {
    if (storeCode) dispatch(FetchStoreWorkflows(storeCode));
  }, [dispatch, storeCode]);

  const toggle = async (workflow: StoreWorkflow, isEnabled: boolean) => {
    if (!storeCode) return;
    try {
      await dispatch(
        UpdateStoreWorkflow({ storeCode, code: workflow.code, isEnabled }),
      ).unwrap();
      toast.success(
        isEnabled
          ? `${workflow.name} turned on`
          : `${workflow.name} turned off`,
      );
    } catch {
      // The thunk already showed the error toast.
    }
  };

  return (
    <DataTable
      columns={getColumns(pendingCode, toggle)}
      data={pageRows}
      totalCount={FetchStoreWorkflowsData.length}
      pagination={pagination}
      onPaginationChange={setPagination}
      isLoading={
        FetchStoreWorkflowsIsLoading && !FetchStoreWorkflowsData.length
      }
      noun="workflow"
      emptyTitle="No workflows yet"
      emptyDescription="Workflows appear here once the platform has set them up."
    />
  );
}
