"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  IconClock,
  IconCoins,
  IconDatabase,
  IconRobot,
  IconX,
} from "@tabler/icons-react";

import AIUsageCharts from "@/components/custom/ai-usage/ai-usage-chart-grid";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import {
  fetchAIUsageDaily,
  fetchAIUsageLatencyTrend,
  fetchAIUsageSummary,
  fetchAIUsageTokenSplit,
  fetchAIUsageWorkflowCosts,
} from "@/redux/api-slice/ai-usage-slice";
import { FetchThreads } from "@/redux/api-slice/thread-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

type Filters = {
  threadIds: string[];
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = {
  threadIds: [],
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
    FetchAIUsageLatencyTrendState,
  } = useAppSelector((state) => state.GetAIUsageReducer);
  const { FetchThreadsListData, FetchThreadsIsLoading } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadsState,
  );
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const selectedThreadIds = useDebounce(filters.threadIds);
  const threadIds =
    FetchThreadsListData?.results.map((thread) => thread.id) ?? [];
  const threadComboboxAnchor = useComboboxAnchor();

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
      latency_trend: FetchAIUsageLatencyTrendState.FetchAIUsageLatencyTrendData,
    },
  };

  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchThreads({ store_code: storeCode, page: 1, limit: 100 }));
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (!storeCode) return;
    const args = {
      storeCode,
      threadIds: selectedThreadIds,
      from: filters.from,
      to: filters.to,
    };
    dispatch(fetchAIUsageSummary(args));
    dispatch(fetchAIUsageDaily(args));
    dispatch(fetchAIUsageTokenSplit(args));
    dispatch(fetchAIUsageWorkflowCosts(args));
    dispatch(fetchAIUsageLatencyTrend(args));
  }, [dispatch, storeCode, selectedThreadIds, filters.from, filters.to]);

  const update = (key: "from" | "to", value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const dateRange: DateRange | undefined = filters.from
    ? {
        from: parseISO(filters.from),
        to: filters.to ? parseISO(filters.to) : undefined,
      }
    : undefined;
  const updateDateRange = (range: DateRange | undefined) =>
    setFilters((current) => ({
      ...current,
      from: range?.from ? format(range.from, "yyyy-MM-dd") : "",
      to: range?.to ? format(range.to, "yyyy-MM-dd") : "",
    }));
  const hasFilters =
    filters.threadIds.length > 0 || Boolean(filters.from || filters.to);

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
      value: `$${totalCost.toFixed(2)}`,
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Combobox
              multiple
              autoHighlight
              items={threadIds}
              value={filters.threadIds}
              onValueChange={(threadIds) =>
                setFilters((current) => ({ ...current, threadIds }))
              }
            >
              <ComboboxChips ref={threadComboboxAnchor} className="w-full">
                <ComboboxValue>
                  {(selectedIds) => (
                    <>
                      {(selectedIds as string[]).map((id) => (
                        <ComboboxChip key={id}>{id}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput
                        aria-label="Thread IDs"
                        placeholder={
                          FetchThreadsIsLoading
                            ? "Loading threads..."
                            : "Select thread IDs"
                        }
                      />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={threadComboboxAnchor}>
                <ComboboxEmpty>No threads found.</ComboboxEmpty>
                <ComboboxList>
                  {(id) => (
                    <ComboboxItem key={id} value={id}>
                      {id}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Field className="gap-0">
              <FieldLabel htmlFor="ai-usage-date-range" className="sr-only">
                Date range
              </FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="ai-usage-date-range"
                    className="w-full justify-start px-2.5 font-normal"
                  >
                    <CalendarIcon />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        Pick a date range
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={updateDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </Field>
          </div>
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {(["from", "to"] as const).map((key) =>
                filters[key] ? (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update(key, "")}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    {filters[key]} <IconX className="size-3" />
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

      <AIUsageCharts data={data} from={filters.from} to={filters.to} />
    </div>
  );
}
