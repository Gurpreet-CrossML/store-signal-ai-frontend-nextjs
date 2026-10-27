"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";

import CreditBars from "@/components/custom/ai-usage/credit-bars";
import ChartEmptyState from "@/components/custom/ai-usage/chart-empty-state";
import CreditDailyChart from "@/components/custom/ai-usage/credit-daily-chart";
import {
  DEFAULT_DASHBOARD_FILTERS,
  DashboardRangeFilter,
  dashboardRangeLabel,
  resolveDashboardRange,
  type DashboardFilterState,
} from "@/components/custom/dashboard-filters";
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

// Billed features, grouped the way the store owner thinks about them.
const FEATURE_GROUPS: { title: string; features: Record<string, string> }[] = [
  { title: "Chat AI", features: { chat_turn: "Chat replies" } },
  {
    title: "Helpdesk AI",
    features: {
      ticket_message_draft: "Suggested replies for agents",
      ticket_draft: "Ticket drafts",
      ticket_message_improve: "Reply improvements",
      ticket_translate: "Ticket translations",
      ticket_auto_translate: "Reply auto-translations",
    },
  },
  {
    title: "Social AI",
    features: {
      comment_reply: "Comment replies",
      dm_reply: "Direct message replies",
      comment_tagging: "Comment triage and tagging",
    },
  },
];

const formatDate = (value: string) => format(parseISO(value), "MMM d, yyyy");

/** Store-level AI credit usage: balance, plan cycle, and where credits went. */
export default function AIUsage() {
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
    dispatch(fetchAIUsageCreditDaily(args));
    dispatch(fetchAIUsageByFeature(args));
  }, [dispatch, storeCode, from, to]);

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
      .map(([feature, label]) => {
        const row = featureCredits.get(feature);
        const calls = Number(row?.calls) || 0;
        const rowCredits = Number(row?.credits_charged) || 0;
        return {
          label,
          note: `${calls.toLocaleString()} ${calls === 1 ? "call" : "calls"}, 1 credit each`,
          credits: rowCredits,
          extra: share(rowCredits),
        };
      })
      .filter((row) => row.credits > 0);
    return {
      ...group,
      rows,
      total: rows.reduce((sum, row) => sum + row.credits, 0),
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {isLoading && <Spinner className="size-4" />}
        <DashboardRangeFilter filters={filters} onChange={setFilters} />
      </div>

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

      {from && to && <CreditDailyChart data={daily} from={from} to={to} />}

      <Card>
        <CardHeader>
          <CardTitle>Where the credits went</CardTitle>
          <CardDescription>
            Each capability that used credits in this period. Every AI call is
            charged one credit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featureGroups.length ? (
            <CreditBars
              nameLabel="Capability"
              extraLabel="Share"
              rows={featureGroups.flatMap((group) => [
                {
                  heading: true,
                  label: `${group.title} · ${group.total.toLocaleString()} credits, ${share(group.total)} of the period`,
                  credits: group.total,
                },
                ...group.rows,
              ])}
            />
          ) : (
            <ChartEmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
