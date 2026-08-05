"use client";

import { useEffect, useState } from "react";
import {
  IconClock,
  IconCoins,
  IconDatabase,
  IconRobot,
  IconX,
} from "@tabler/icons-react";

import AIUsageCharts from "@/components/custom/ai-usage/ai-usage-chart-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import {
  fetchAIUsageAgentCalls,
  fetchAIUsageDaily,
  fetchAIUsageLatencyTrend,
  fetchAIUsageModelTokens,
  fetchAIUsageSummary,
  fetchAIUsageTokenSplit,
  fetchAIUsageWorkflowCosts,
} from "@/redux/api-slice/ai-usage-slice";
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

/**
 * Renders the AI usage dashboard and coordinates filter-driven backend
 * requests for its summary cards and charts.
 */
export default function AIUsage() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchAIUsageSummaryState,
    FetchAIUsageDailyState,
    FetchAIUsageTokenSplitState,
    FetchAIUsageWorkflowCostsState,
    FetchAIUsageAgentCallsState,
    FetchAIUsageModelTokensState,
    FetchAIUsageLatencyTrendState,
  } = useAppSelector((state) => state.GetAIUsageReducer);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [agentWorkflow, setAgentWorkflow] = useState("");
  const workflowId = useDebounce(filters.workflowId.trim());
  const agentId = useDebounce(filters.agentId.trim());
  const model = useDebounce(filters.model.trim());

  const summary = FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitIsSuccess
    ? {
        ...FetchAIUsageSummaryState.FetchAIUsageSummaryData,
        ...FetchAIUsageTokenSplitState.FetchAIUsageTokenSplitData,
      }
    : FetchAIUsageSummaryState.FetchAIUsageSummaryData;
  const data = {
    summary,
    charts: {
      daily_usage: FetchAIUsageDailyState.FetchAIUsageDailyData,
      workflow_costs:
        FetchAIUsageWorkflowCostsState.FetchAIUsageWorkflowCostsData,
      agent_calls:
        FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsData.results,
      agent_workflows:
        FetchAIUsageAgentCallsState.FetchAIUsageAgentCallsData.workflows,
      model_tokens: FetchAIUsageModelTokensState.FetchAIUsageModelTokensData,
      latency_trend: FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendData,
    },
  };

  useEffect(() => {
    if (!storeCode) return;
    const args = {
      storeCode,
      workflowId,
      agentId,
      model,
      from: filters.from,
      to: filters.to,
    };
    dispatch(fetchAIUsageSummary(args));
    dispatch(fetchAIUsageDaily(args));
    dispatch(fetchAIUsageTokenSplit(args));
    dispatch(fetchAIUsageWorkflowCosts(args));
    dispatch(fetchAIUsageModelTokens(args));
    dispatch(fetchAIUsageLatencyTrend(args));
  }, [
    dispatch,
    storeCode,
    workflowId,
    agentId,
    model,
    filters.from,
    filters.to,
  ]);

  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      fetchAIUsageAgentCalls({
        storeCode,
        workflowId: agentWorkflow || workflowId,
        agentId,
        model,
        from: filters.from,
        to: filters.to,
      }),
    );
  }, [
    dispatch,
    storeCode,
    workflowId,
    agentWorkflow,
    agentId,
    model,
    filters.from,
    filters.to,
  ]);

  const update = (key: keyof Filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const hasFilters = Object.values(filters).some(Boolean);

  // API decimal and aggregate fields may arrive as numeric strings. Convert
  // them only at the presentation boundary so Redux keeps the backend payload.
  const totalCost = Number(data.summary.total_cost) || 0;
  const totalRecords = Number(data.summary.total_records) || 0;
  const averageLatency = Number(data.summary.average_latency) || 0;
  const totalTokens = Number(data.summary.total_tokens) || 0;
  const inputTokens = Number(data.summary.input_tokens) || 0;
  const outputTokens = Number(data.summary.output_tokens) || 0;

  const metrics = [
    {
      label: "Total cost",
      value: `$${totalCost.toFixed(4)}`,
      note: "USD estimated",
      icon: IconCoins,
    },
    {
      label: "Agent calls",
      value: totalRecords.toLocaleString(),
      note: "workflow invocations",
      icon: IconRobot,
    },
    {
      label: "Avg latency",
      value:
        averageLatency >= 1000
          ? `${(averageLatency / 1000).toFixed(2)} s`
          : `${Math.round(averageLatency)} ms`,
      note: "per agent call",
      icon: IconClock,
    },
    {
      label: "Total tokens",
      value: compact.format(totalTokens),
      note: `${compact.format(inputTokens)} input · ${compact.format(outputTokens)} output`,
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
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
                  {FetchAIUsageSummaryState.FetchAIUsageSummaryIsLoading ? (
                    <Spinner className="my-1 size-5" />
                  ) : (
                    value
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AIUsageCharts
        data={data}
        agentWorkflow={agentWorkflow || workflowId}
        onAgentWorkflowChange={setAgentWorkflow}
      />
    </div>
  );
}
