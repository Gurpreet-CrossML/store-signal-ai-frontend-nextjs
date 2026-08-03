"use client";

import { useEffect, useState } from "react";
import {
  IconClock,
  IconCoins,
  IconDatabase,
  IconRobot,
  IconX,
} from "@tabler/icons-react";

import AIUsageCharts from "@/components/custom/ai-usage/ai-usage-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchAIUsage } from "@/redux/api-slice/ai-usage-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

type Filters = {
  workflowId: string;
  agentId: string;
  model: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = {
  workflowId: "",
  agentId: "",
  model: "",
  from: "",
  to: "",
};

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export default function AIUsage() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector((state) => state.GetStoresReducer.selectedStore);
  const { data, isLoading } = useAppSelector((state) => state.GetAIUsageReducer);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const workflowId = useDebounce(filters.workflowId.trim());
  const agentId = useDebounce(filters.agentId.trim());
  const model = useDebounce(filters.model.trim());

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      fetchAIUsage({
        storeCode,
        page: 1,
        pageSize: 1,
        workflowId,
        agentId,
        model,
        from: filters.from,
        to: filters.to,
      }),
    );
  }, [dispatch, storeCode, workflowId, agentId, model, filters.from, filters.to]);

  const update = (key: keyof Filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const hasFilters = Object.values(filters).some(Boolean);
  const metrics = [
    {
      label: "Total cost",
      value: `$${data.summary.total_cost.toFixed(4)}`,
      note: "USD estimated",
      icon: IconCoins,
    },
    {
      label: "Agent calls",
      value: data.summary.total_records.toLocaleString(),
      note: "workflow invocations",
      icon: IconRobot,
    },
    {
      label: "Avg latency",
      value:
        data.summary.average_latency >= 1000
          ? `${(data.summary.average_latency / 1000).toFixed(2)} s`
          : `${Math.round(data.summary.average_latency)} ms`,
      note: "per agent call",
      icon: IconClock,
    },
    {
      label: "Total tokens",
      value: compact.format(data.summary.total_tokens),
      note: `${compact.format(data.summary.input_tokens)} input · ${compact.format(data.summary.output_tokens)} output`,
      icon: IconDatabase,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 pt-0">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">AI Usage</h2>
        <p className="text-sm text-muted-foreground">
          Track token spend, model costs, and latency across your AI workflows.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              aria-label="Workflow ID"
              placeholder="Workflow ID"
              value={filters.workflowId}
              onChange={(event) => update("workflowId", event.target.value)}
            />
            <Input
              aria-label="Agent ID"
              placeholder="Agent ID"
              value={filters.agentId}
              onChange={(event) => update("agentId", event.target.value)}
            />
            <Input
              aria-label="Model"
              placeholder="Model"
              value={filters.model}
              onChange={(event) => update("model", event.target.value)}
            />
            <Input
              aria-label="From date"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => update("from", event.target.value)}
            />
            <Input
              aria-label="To date"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => update("to", event.target.value)}
            />
          </div>
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(filters).map(([key, value]) =>
                value ? (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update(key as keyof Filters, "")}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    {value} <IconX className="size-3" />
                  </button>
                ) : null,
              )}
              <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {isLoading ? <Spinner className="my-1 size-5" /> : value}
                </p>
                <p className="truncate text-xs text-muted-foreground">{note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AIUsageCharts data={data} />
    </div>
  );
}
