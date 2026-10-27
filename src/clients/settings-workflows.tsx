"use client";

import { useEffect } from "react";
import { IconAutomaticGearbox, IconLock } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
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

// Placeholder cards shown while the list loads.
const SKELETON_CARDS = 6;

/**
 * Settings → Workflows: one card per platform workflow with an on/off switch
 * for the selected store. The list is the same for every company; a switch
 * only changes this store. Locked workflows show a lock instead of a usable
 * switch, since the backend refuses to turn them off.
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

  if (FetchStoreWorkflowsIsLoading && !FetchStoreWorkflowsData.length) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!FetchStoreWorkflowsData.length) {
    return (
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia>
            <IconAutomaticGearbox />
          </EmptyMedia>
          <EmptyTitle>No workflows yet</EmptyTitle>
          <EmptyDescription>
            Workflows appear here once the platform has set them up.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {FetchStoreWorkflowsData.map((workflow) => (
        <WorkflowCard
          key={workflow.code}
          workflow={workflow}
          saving={pendingCode === workflow.code}
          onToggle={(isEnabled) => toggle(workflow, isEnabled)}
        />
      ))}
    </div>
  );
}

function WorkflowCard({
  workflow,
  saving,
  onToggle,
}: {
  workflow: StoreWorkflow;
  saving: boolean;
  onToggle: (isEnabled: boolean) => void;
}) {
  const locked = !workflow.can_disable;
  // What the workflow depends on, shown so a store knows why it may not work.
  const needs = [
    workflow.shopify_supported && "Shopify",
    workflow.magento_supported && "Magento",
    workflow.kb_supported && "Knowledge base",
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
          {workflow.icon ? (
            // Plain <img>: the icon is a temporary S3 URL, not a static asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workflow.icon} alt="" className="size-6 object-contain" />
          ) : (
            <IconAutomaticGearbox className="size-5" />
          )}
        </div>

        {locked ? (
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
        ) : (
          <Switch
            checked={workflow.is_enabled}
            disabled={saving}
            onCheckedChange={onToggle}
            aria-label={`Turn ${workflow.name} ${workflow.is_enabled ? "off" : "on"}`}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <Typography variant="h6" as="h3">
          {workflow.name}
        </Typography>
        <Typography variant="muted" className="line-clamp-2">
          {workflow.description}
        </Typography>
      </div>

      {workflow.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {workflow.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        <Badge variant={workflow.is_enabled ? "secondary" : "outline"}>
          {workflow.is_enabled ? "On" : "Off"}
        </Badge>
        {needs.length > 0 && (
          <Typography variant="muted" className="text-xs">
            Needs {needs.join(" · ")}
          </Typography>
        )}
      </div>
    </div>
  );
}
