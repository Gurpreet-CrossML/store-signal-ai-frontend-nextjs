"use client";

import { useEffect, useState } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { IconAutomaticGearbox, IconLock, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { DataTable } from "@/components/custom/data-table";
import { SearchInput } from "@/components/custom/search-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { ACTIVE_FILTER_STYLE, ALL_FILTER_VALUE } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  FetchStoreWorkflows,
  UpdateStoreWorkflow,
  type StoreWorkflow,
} from "@/redux/api-slice/store-settings-slice";

/** Shown in a cell that has nothing to say. */
const EMPTY_CELL = <Typography variant="muted">—</Typography>;

/** A switch the store flipped, waiting for its approval in the dialog. */
type SwitchChange = { workflow: StoreWorkflow; isEnabled: boolean };

/**
 * One row per platform workflow: what it is, the AI it belongs to, its tags
 * and the on/off switch.
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
      accessorKey: "agent_label",
      header: "AI agent",
      cell: ({ row }) => (
        <Badge variant="secondary" className="whitespace-nowrap">
          {row.original.agent_label}
        </Badge>
      ),
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
            disabled={pendingCode !== null}
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
 * on/off switch for the selected store, searchable by name and filtered by
 * AI agent. The list is the same for every company; a switch only
 * changes this store. Every switch asks for approval first, showing what
 * customers will notice and which linked workflows change with it.
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
  const [change, setChange] = useState<SwitchChange | null>(null);
  const [search, setSearch] = useState("");
  const [agent, setAgent] = useState<string>(ALL_FILTER_VALUE);

  // The whole list comes in one response; the table filters and pages it here.
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const query = search.trim().toLowerCase();
  const rows = FetchStoreWorkflowsData.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(query) &&
      (agent === ALL_FILTER_VALUE || workflow.agent === agent),
  );
  const pageRows = rows.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize,
  );
  const filtered = Boolean(query) || agent !== ALL_FILTER_VALUE;

  // Agent choices come from the list itself, so a new agent shows up.
  const agentOptions = [
    ...new Map(
      FetchStoreWorkflowsData.map((workflow) => [
        workflow.agent,
        workflow.agent_label,
      ]),
    ),
  ];

  // Any filter change starts again from the first page.
  const filterBy =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

  const clearFilters = () => {
    setSearch("");
    setAgent(ALL_FILTER_VALUE);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  useEffect(() => {
    if (storeCode) dispatch(FetchStoreWorkflows(storeCode));
  }, [dispatch, storeCode]);

  const save = async ({ workflow, isEnabled }: SwitchChange) => {
    if (!storeCode) return;
    try {
      const saved = await dispatch(
        UpdateStoreWorkflow({ storeCode, code: workflow.code, isEnabled }),
      ).unwrap();
      const others = saved.also_changed.length
        ? ` with ${saved.also_changed.length} linked workflow${saved.also_changed.length > 1 ? "s" : ""}`
        : "";
      toast.success(
        `${workflow.name} turned ${isEnabled ? "on" : "off"}${others}`,
      );
    } catch {
      // The thunk already showed the error toast.
    } finally {
      setChange(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={filterBy(setSearch)}
          placeholder="Search workflows…"
          label="Search workflows"
          className="w-full sm:w-64"
        />
        <Select value={agent} onValueChange={filterBy(setAgent)}>
          <SelectTrigger
            aria-label="Filter by AI agent"
            className={cn(
              "sm:w-44",
              agent !== ALL_FILTER_VALUE && ACTIVE_FILTER_STYLE,
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All AI agents</SelectItem>
            {agentOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={clearFilters}
          >
            <IconX />
            Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={getColumns(pendingCode, (workflow, isEnabled) =>
          setChange({ workflow, isEnabled }),
        )}
        data={pageRows}
        totalCount={rows.length}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={
          FetchStoreWorkflowsIsLoading && !FetchStoreWorkflowsData.length
        }
        noun="workflow"
        emptyTitle={
          filtered ? "No workflows match these filters" : "No workflows yet"
        }
        emptyDescription={
          filtered
            ? "Try another search or AI agent."
            : "Workflows appear here once the platform has set them up."
        }
      />
      <ConfirmSwitch
        change={change}
        workflows={FetchStoreWorkflowsData}
        saving={pendingCode !== null}
        onCancel={() => setChange(null)}
        onConfirm={save}
      />
    </div>
  );
}

/** Lists names the way a sentence does: "a, b, and c". */
const joinNames = (names: string[]) =>
  new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(
    names,
  );

/**
 * Approval dialog for one switch. Tells the merchant which AI it affects,
 * which customer questions the chat widget and WhatsApp stop (or start)
 * answering, and which linked workflows change with it (only the ones not
 * already in that state).
 */
function ConfirmSwitch({
  change,
  workflows,
  saving,
  onCancel,
  onConfirm,
}: {
  change: SwitchChange | null;
  workflows: StoreWorkflow[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: (change: SwitchChange) => void;
}) {
  if (!change) return null;
  const { workflow, isEnabled } = change;
  const linkedCodes = isEnabled
    ? workflow.also_turns_on
    : workflow.also_turns_off;
  const linked = workflows.filter(
    (other) =>
      linkedCodes.includes(other.code) && other.is_enabled !== isEnabled,
  );
  const affected = [workflow, ...linked];
  const agents = [...new Set(affected.map((item) => item.agent_label))];
  const linkedNames = joinNames(linked.map((other) => other.name));
  const verb = isEnabled ? "on" : "off";

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Turn {verb} {workflow.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This affects your {joinNames(agents)}. Your website chat widget and
            WhatsApp will {isEnabled ? "start" : "stop"} answering customers
            about:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto rounded-lg bg-muted/50 p-3">
          {affected.map((item) => (
            <li key={item.code} className="flex flex-col">
              <span className="flex items-center gap-2 text-sm font-medium">
                {item.name}
                {/* Name the AI per row only when the change spans more than one. */}
                {agents.length > 1 && (
                  <Badge variant="outline">{item.agent_label}</Badge>
                )}
              </span>
              <Typography variant="muted" className="text-xs">
                {item.description}
              </Typography>
            </li>
          ))}
        </ul>

        {linked.length > 0 && (
          <Typography variant="muted" className="text-sm">
            {isEnabled
              ? `${workflow.name} depends on ${linkedNames}, so ${linked.length > 1 ? "they" : "it"} will be turned on too.`
              : `${linkedNames} ${linked.length > 1 ? "depend" : "depends"} on ${workflow.name}, so ${linked.length > 1 ? "they" : "it"} will be turned off too.`}
          </Typography>
        )}

        <Typography variant="muted" className="text-sm">
          {isEnabled
            ? "This applies from the next customer message."
            : "If a customer asks about these, the AI will say it can't help right now and offer to create a support ticket for your team. You can turn them back on at any time."}
        </Typography>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isEnabled ? "default" : "destructive"}
            disabled={saving}
            // Keep the dialog open while saving; save() closes it.
            onClick={(event) => {
              event.preventDefault();
              onConfirm(change);
            }}
          >
            {saving && <Spinner data-icon="inline-start" />}
            {linked.length
              ? `Turn ${verb} ${affected.length} workflows`
              : `Turn ${verb}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
