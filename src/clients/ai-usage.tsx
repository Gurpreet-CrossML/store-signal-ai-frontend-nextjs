"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";

import CreditGroups from "@/components/custom/ai-usage/credit-bars";
import ChartEmptyState from "@/components/custom/ai-usage/chart-empty-state";
import CreditDailyChart from "@/components/custom/ai-usage/credit-daily-chart";
import { FEATURE_GROUPS } from "@/components/custom/ai-usage/feature-groups";
import {
  DEFAULT_DASHBOARD_FILTERS,
  DashboardRangeFilter,
  dashboardRangeLabel,
  resolveDashboardRange,
  type DashboardFilterState,
} from "@/components/custom/dashboard-filters";
import { PageHeading } from "@/components/custom/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import {
  fetchAIUsageByFeature,
  fetchAIUsageCreditDaily,
  fetchAIUsageCreditSummary,
  fetchCreditStatus,
} from "@/redux/api-slice/ai-usage-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

const formatDate = (value: string) => format(parseISO(value), "MMM d, yyyy");

// The day-by-day chart always covers the last 7 days, today included.
const CHART_DAYS = 7;

/** Store-level AI credit usage: balance, plan cycle, and where credits went. */
export default function AIUsage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );
  const {
    FetchCreditStatusState,
    FetchAIUsageCreditSummaryState,
    FetchAIUsageCreditDailyState,
    FetchAIUsageByFeatureState,
  } = useAppSelector((state) => state.GetAIUsageReducer);
  const [filters, setFilters] = useState<DashboardFilterState>({
    ...DEFAULT_DASHBOARD_FILTERS,
    range: "30d",
  });
  const { from, to } = resolveDashboardRange(filters);

  useEffect(() => {
    // A custom range waits for both ends to be picked.
    if (!storeCode || !from || !to) return;
    const args = { storeCode, from, to };
    dispatch(fetchCreditStatus(args));
    dispatch(fetchAIUsageCreditSummary(args));
    dispatch(fetchAIUsageByFeature(args));
  }, [dispatch, storeCode, from, to]);

  // Its own window, so the chart stays on the last 7 days whatever range the
  // rest of the page shows.
  const chartTo = format(new Date(), "yyyy-MM-dd");
  const chartFrom = format(subDays(new Date(), CHART_DAYS - 1), "yyyy-MM-dd");
  useEffect(() => {
    if (!storeCode) return;
    dispatch(
      fetchAIUsageCreditDaily({ storeCode, from: chartFrom, to: chartTo }),
    );
  }, [dispatch, storeCode, chartFrom, chartTo]);

  const credits = FetchCreditStatusState.FetchCreditStatusData;
  const summary = FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryData;
  const daily = FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyData;
  const byFeature = FetchAIUsageByFeatureState.FetchAIUsageByFeatureData;
  const isLoading =
    FetchCreditStatusState.FetchCreditStatusIsLoading ||
    FetchAIUsageCreditSummaryState.FetchAIUsageCreditSummaryIsLoading ||
    FetchAIUsageCreditDailyState.FetchAIUsageCreditDailyIsLoading ||
    FetchAIUsageByFeatureState.FetchAIUsageByFeatureIsLoading;
  const used = Number(summary.credits_charged) || 0;
  // Share of the period's credits, e.g. "50.0%".
  const share = (part: number) =>
    used ? `${((part / used) * 100).toFixed(1)}%` : "–";
  const daysLeft = credits?.end_date
    ? differenceInCalendarDays(parseISO(credits.end_date), new Date())
    : null;

  const featureCredits = new Map(byFeature.map((row) => [row.feature, row]));
  const featureGroups = FEATURE_GROUPS.map((group) => {
    const rows = Object.entries(group.features)
      .map(([feature, { name, description }]) => {
        const row = featureCredits.get(feature);
        const calls = Number(row?.calls) || 0;
        const rowCredits = Number(row?.credits_charged) || 0;
        return {
          label: name,
          note: description,
          calls,
          credits: rowCredits,
          share: share(rowCredits),
        };
      })
      // By calls, so unbilled features (Chat analysis) show with 0 credits.
      .filter((row) => row.calls > 0);
    const total = rows.reduce((sum, row) => sum + row.credits, 0);
    return {
      label: group.title,
      calls: rows.reduce((sum, row) => sum + row.calls, 0),
      credits: total,
      share: share(total),
      rows,
    };
  }).filter((group) => group.rows.length);

  const metrics = [
    {
      label: "Credits left",
      value: credits ? credits.balance.toLocaleString() : "–",
      // Empty until loaded, so it never flashes the out-of-credits warning.
      note: !credits
        ? ""
        : credits.has_quota
          ? "AI is replying normally"
          : "Out of credits: the AI has stopped replying",
      danger: credits && !credits.has_quota,
    },
    {
      label: "Plan cycle",
      value: credits?.plan?.name ?? "No active plan",
      note:
        credits?.start_date && credits.end_date
          ? `${formatDate(credits.start_date)} – ${formatDate(credits.end_date)}${
              daysLeft !== null ? `, renews in ${daysLeft} days` : ""
            }`
          : "No plan month is running",
    },
    {
      label: "Plan allowance",
      value: credits?.monthly_credits
        ? `${credits.monthly_credits.toLocaleString()} / month`
        : "–",
      note: "Credits added each plan month",
    },
    {
      label: "Credits used",
      value: used.toLocaleString(),
      note: dashboardRangeLabel(filters),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isLoading && <Spinner className="size-4" />}
            <DashboardRangeFilter filters={filters} onChange={setFilters} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, danger }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <CardTitle>
                <Typography variant="muted" as="h3">
                  {label}
                </Typography>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Typography variant="h3" as="p" className="tabular-nums">
                {value}
              </Typography>
              <p
                className={`mt-1 text-xs ${danger ? "text-destructive" : "text-muted-foreground"}`}
              >
                {note}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreditDailyChart data={daily} from={chartFrom} to={chartTo} />

      <Card>
        <CardHeader>
          <CardTitle>Where the credits went</CardTitle>
          <CardDescription>
            Credits by capability in this period, largest first. Open a group to
            see its features. Each billed AI call is charged one credit; chat
            analysis is free.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featureGroups.length ? (
            <CreditGroups groups={featureGroups} />
          ) : (
            <ChartEmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
