"use client";

import { ChatOrderFunnelSankey } from "@/components/custom/chat-order-funnel-sankey";
import Link from "next/link";

import {
  CustomerInteractionLineChart,
  type Granularity,
} from "@/components/custom/customer-interaction-line-chart";
import { GuestVsSignedUserRadialChart } from "@/components/custom/guest-vs-signed-user-radial-chart";
import { PerformanceRadialChart } from "@/components/custom/performance-radial-char";
import { SentimentsPieChart } from "@/components/custom/sentiments-pie-chat";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DashboardFilters,
  DEFAULT_DASHBOARD_FILTERS,
  dashboardRangeLabel,
  resolveDashboardRange,
} from "@/components/custom/dashboard-filters";
import { InfoIcon } from "@/components/custom/info-icon";
import { PageHeading } from "@/components/custom/page-heading";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { custructTimeInHumanReadableFormat } from "@/lib/helpers";
import { buildDashboardReportHtml } from "@/lib/dashboard-report";
import {
  FetchDashboard,
  FetchChatOrderFunnel,
  FetchConversationHistory,
  type MetricTrend,
} from "@/redux/api-slice/dashboard-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { subMonths } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SummaryMetric = {
  label: string;
  value: string;
  infoText: string;
  status: string;
  statusVariant: "success" | "warning" | "neutral" | "info" | "danger";
  href?: string;
  statusHref?: string;
  trend?: MetricTrend;
};

const displayMetricName = (metric: string) =>
  metric.replace(/([a-z])([A-Z])/g, "$1 $2");

// How often every card and chart reloads in place.
const AUTO_REFRESH_MS = 30_000;

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

// Default date range per granularity, anchored to today.
const defaultRange = (granularity: Granularity) => {
  const to = new Date();
  const from = new Date();
  if (granularity === "hourly") {
    from.setDate(to.getDate() - 7);
  } else if (granularity === "weekly") {
    from.setDate(to.getDate() - 28);
  } else {
    // subMonths clamps month-end overflow (e.g. Mar 31 -> Feb 28).
    return { from: toISODate(subMonths(to, 1)), to: toISODate(to) };
  }
  return { from: toISODate(from), to: toISODate(to) };
};

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore,
  );

  const { FetchFeedbackInsightsData } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchFeedbackInsightsState,
  );

  const { FetchEngagementData } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchEngagementDataState,
  );

  const { FetchOperationalEfficiencyData } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchOperationalEfficiencyDataState,
  );

  const { FetchUserMatrixData } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchUserMatrixState,
  );

  const { FetchConversionRateData } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchConversionRateDataState,
  );

  const { FetchChatOrderFunnelData, FetchChatOrderFunnelIsLoading } =
    useAppSelector(
      (state) => state.GetDashboardReducer.FetchChatOrderFunnelState,
    );

  const { FetchConversationHistoryData, FetchConversationHistoryIsLoading } =
    useAppSelector(
      (state) => state.GetDashboardReducer.FetchConversationHistoryState,
    );

  const { FetchThreadCountsData } = useAppSelector(
    (state) => state.GetThreadReducer.FetchThreadCountsState,
  );

  const [filters, setFilters] = useState(DEFAULT_DASHBOARD_FILTERS);
  const [granularity, setGranularity] = useState<Granularity>("hourly");
  // The interaction chart keeps its own date range, set by its own controls.
  const [chartFrom, setChartFrom] = useState(() => defaultRange("hourly").from);
  const [chartTo, setChartTo] = useState(() => defaultRange("hourly").to);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshRef = useRef(async () => {});

  const handleGranularityChange = (next: Granularity) => {
    setGranularity(next);
    const range = defaultRange(next);
    setChartFrom(range.from);
    setChartTo(range.to);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRef.current();
    setRefreshing(false);
  };

  const { range, from, to, channel } = filters;
  const periodLabel = dashboardRangeLabel(filters);

  useEffect(() => {
    if (!storeCode) return;
    let inFlight: { abort: () => void }[] = [];

    // Load the dashboard data using the currently selected filters.
    // When silent is true, keep the existing data visible while refreshing it.
    const load = async (silent: boolean) => {
      inFlight.forEach((request) => request.abort());

      const args = {
        storeCode,
        ...resolveDashboardRange({ range, from, to, channel }),
        channel: channel || undefined,
        silent,
      };

      const batch = [
        // Fetch the data for all five dashboard summary widgets.
        dispatch(FetchDashboard(args)),

        // Fetch the funnel data showing how chats lead to orders.
        dispatch(FetchChatOrderFunnel(args)),

        // Fetch the conversation history grouped by the selected time interval.
        dispatch(
          FetchConversationHistory({
            ...args,
            from: chartFrom,
            to: chartTo,
            granularity,
            aggregated: true,
          }),
        ),
      ];

      // Track the current requests so older requests can be ignored.
      inFlight = batch;

      const results = await Promise.all(batch);

      // Ignore this result if a newer request has already started.
      if (inFlight !== batch) return;

      // All requests have finished, so clear the tracked requests.
      inFlight = [];

      // Update the last-refreshed time only if every request succeeds.
      // If a background refresh fails, keep the previous time visible so
      // users know the displayed data may not be up to date.
      // Aborted requests are ignored by the Redux reducers.
      if (
        results.every((result) => result.meta.requestStatus === "fulfilled")
      ) {
        setLastUpdated(new Date());
      }
    };

    load(false);
    refreshRef.current = () => load(true);
    // A custom range is a fixed past window, so only presets auto-refresh.
    const timer =
      range === "custom"
        ? undefined
        : setInterval(() => {
            if (!document.hidden) load(true);
          }, AUTO_REFRESH_MS);

    return () => {
      clearInterval(timer);
      inFlight.forEach((request) => request.abort());
      inFlight = [];
    };
  }, [
    dispatch,
    storeCode,
    range,
    from,
    to,
    channel,
    granularity,
    chartFrom,
    chartTo,
  ]);

  // Presets keep no dates of their own, so resolve the range actually on screen.
  const exportRange = resolveDashboardRange(filters);

  // Drill-through link to the Threads list, pre-filtered to match a card.
  const threadsHref = (extraParams: Record<string, string>) => {
    const params = new URLSearchParams(extraParams);
    params.set("from", exportRange.from);
    params.set("to", exportRange.to);
    if (channel) params.set("channel", channel);
    return `/threads?${params.toString()}`;
  };

  const performanceSummaryMetrics: SummaryMetric[] = [
    {
      label: "CSAT Score",
      value: `${FetchFeedbackInsightsData?.csat_score?.percentage || 0}%`,
      infoText:
        "Shows how satisfied customers were after interacting with the chatbot, based on submitted feedback and ratings.",
      status: "Customer Satisfaction",
      statusVariant: "info" as const,
      trend: FetchFeedbackInsightsData?.csat_score?.trend,
    },
    {
      label: "Conversion Rate",
      value: `${FetchConversionRateData?.percentage || 0}%`,
      infoText:
        "Percentage of chatbot sessions that led to an order, where the customer added a product to cart in the chat and ordered it within 24 hours, out of all sessions in the selected period.",
      status: `${FetchConversionRateData?.converted_count || 0} of ${FetchConversionRateData?.total_count || 0} sessions`,
      statusVariant: "info" as const,
      trend: FetchConversionRateData?.trend,
      href: threadsHref({ has_order: "true" }),
      statusHref: threadsHref({ has_order: "true" }),
    },
    {
      label: "Total Sessions",
      value: FetchEngagementData?.total_threads?.toLocaleString() || "0",
      infoText:
        "Shows how many chatbot sessions happened in the selected time range, so you can quickly understand overall traffic volume.",
      status: "All Sessions",
      statusVariant: "neutral" as const,
      trend: FetchEngagementData?.total_threads_trend,
      href: threadsHref({}),
    },
    {
      label: "Active Sessions",
      value: FetchThreadCountsData?.active.toLocaleString() || "0",
      infoText:
        "Shows the number of sessions currently marked as active in the analytics data, helping you gauge current engagement.",
      status: `${FetchThreadCountsData.needsHuman || 0} need a human`,
      statusVariant: "danger" as const,
      // The count is every active chat; only the "needs a human" sub-line
      // goes to the filtered queue.
      href: "/support?filter=all",
      statusHref: "/support?filter=needs_human",
    },
    {
      label: "Avg Response Time",
      value: `${FetchEngagementData?.avg_response_time_seconds?.toFixed(2) || "0.00"}s`,
      infoText:
        "Shows how quickly the chatbot usually replies after a customer message. Lower response times generally mean a smoother experience.",
      status: "Response Metric",
      statusVariant: "info" as const,
      trend: FetchEngagementData?.avg_response_time_trend,
    },
    {
      label: "Avg Handle Time",
      value: `${custructTimeInHumanReadableFormat(FetchFeedbackInsightsData?.avg_handle_time?.value || 0, FetchFeedbackInsightsData?.avg_handle_time?.unit)}`,
      infoText:
        "Shows the average time taken to handle a conversation from start to finish, including resolution.",
      status: "Per Session",
      statusVariant: "info" as const,
      trend: FetchFeedbackInsightsData?.avg_handle_time?.trend,
    },
    {
      label: "AI Resolution Rate",
      value: `${FetchOperationalEfficiencyData?.bot_resolution_rate?.percentage || 0}%`,
      infoText:
        "Shows the share of closed conversations the chatbot resolved on its own, without a human agent taking over or a support ticket being raised.",
      status: `${FetchOperationalEfficiencyData?.bot_resolution_rate?.count || 0} of ${FetchOperationalEfficiencyData?.bot_resolution_rate?.total || 0} chats`,
      statusVariant: "info" as const,
      trend: FetchOperationalEfficiencyData?.bot_resolution_rate?.trend,
      href: threadsHref({
        is_active: "false",
        handled_by: "ai",
        has_ticket: "false",
        has_agent: "false",
      }),
      statusHref: threadsHref({
        is_active: "false",
        handled_by: "ai",
        has_ticket: "false",
        has_agent: "false",
      }),
    },
    {
      label: "Escalation Rate",
      value: `${FetchOperationalEfficiencyData?.escalation_rate?.percentage || 0}%`,
      infoText:
        "Shows the share of all conversations in the selected period that were escalated to a human agent through a support ticket, which can highlight where the bot needs support.",
      status: `${FetchOperationalEfficiencyData?.escalation_rate?.count || 0} of ${FetchOperationalEfficiencyData?.escalation_rate?.total || 0} chats`,
      statusVariant: "info" as const,
      trend: FetchOperationalEfficiencyData?.escalation_rate?.trend,
      href: threadsHref({ has_ticket: "true" }),
      statusHref: threadsHref({ has_ticket: "true" }),
    },
  ];

  const exportFileStem = `dashboard_${storeCode || "all-stores"}_${exportRange.from}_to_${exportRange.to}`;

  const exportCsv = () => {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const reportRows = [
      ...performanceSummaryMetrics.map((metric) => [
        "Performance summary",
        metric.label,
        metric.value,
        metric.status,
      ]),
      ...sentimentPieChartData.map((item) => [
        "Sentiment distribution",
        item.sentiment,
        String(item.score),
        "Customer feedback",
      ]),
      ...performanceRadialChartData.map((item) => [
        "Performance overview",
        displayMetricName(item.metric),
        String(item.value),
        "Service metric",
      ]),
      [
        "User activity",
        "Guest visitors",
        String(userActivityChartData[0]?.guest ?? 0),
        "Guest vs signed-in users",
      ],
      [
        "User activity",
        "Signed-in users",
        String(userActivityChartData[0]?.signed ?? 0),
        "Guest vs signed-in users",
      ],
      ...conversationHistoryChartData.map((point) => [
        "Customer interaction analytics",
        point.label,
        String(point.value),
        `${granularity} user queries`,
      ]),
    ];
    const rows = [
      ["Store", "From", "To", "Section", "Metric", "Value", "Detail"],
      ...reportRows.map((row) => [
        storeCode || "All stores",
        exportRange.from,
        exportRange.to,
        ...row,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => quote(String(value ?? ""))).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exportFileStem}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;
    const renderedChart = (name: string) => {
      const chart =
        document.querySelector(
          `[data-export-chart="${name}"] [data-slot="chart"]`,
        )?.outerHTML ?? "";
      return name === "overview"
        ? chart.replaceAll(">effortScore<", ">EffortScore<")
        : chart;
    };
    reportWindow.document.write(
      buildDashboardReportHtml({
        fileName: exportFileStem,
        storeName: storeCode || "All stores",
        from: exportRange.from,
        to: exportRange.to,
        summary: performanceSummaryMetrics.map((metric) => ({
          label: metric.label,
          value: metric.value,
          detail: metric.status,
        })),
        sentiments: sentimentPieChartData.map((item) => [
          item.sentiment,
          String(item.score),
        ]),
        overview: performanceRadialChartData.map((item) => [
          displayMetricName(item.metric),
          String(item.value),
        ]),
        activity: [
          ["Guest visitors", String(userActivityChartData[0]?.guest ?? 0)],
          ["Signed-in users", String(userActivityChartData[0]?.signed ?? 0)],
          [
            "Total visitors",
            String(
              (userActivityChartData[0]?.guest ?? 0) +
                (userActivityChartData[0]?.signed ?? 0),
            ),
          ],
        ],
        interactions: conversationHistoryChartData.map((point) => [
          point.label,
          String(point.value),
        ]),
        charts: {
          sentiment: renderedChart("sentiment"),
          overview: renderedChart("overview"),
          activity: renderedChart("activity"),
          interaction: renderedChart("interaction"),
        },
      }),
    );
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
    reportWindow.close();
  };

  const sentimentPieChartData = [
    {
      sentiment: "positive",
      score:
        FetchFeedbackInsightsData?.feedback_distribution?.positive?.value || 0,
      fill: "var(--color-positive)",
    },
    {
      sentiment: "neutral",
      score:
        FetchFeedbackInsightsData?.feedback_distribution?.neutral?.value || 0,
      fill: "var(--color-neutral)",
    },
    {
      sentiment: "negative",
      score:
        FetchFeedbackInsightsData?.feedback_distribution?.negative?.value || 0,
      fill: "var(--color-negative)",
    },
  ];

  const performanceRadialChartData = [
    {
      metric: "responseTime",
      value:
        FetchFeedbackInsightsData?.performance_overview?.find(
          (item) => item.metric === "Response Time",
        )?.value || 0,
      fill: "var(--color-responseTime)",
    },
    {
      metric: "resolutionRate",
      value:
        FetchFeedbackInsightsData?.performance_overview?.find(
          (item) => item.metric === "Resolution Rate",
        )?.value || 0,
      fill: "var(--color-resolutionRate)",
    },
    {
      metric: "firstContact",
      value:
        FetchFeedbackInsightsData?.performance_overview?.find(
          (item) => item.metric === "First Contact",
        )?.value || 0,
      fill: "var(--color-firstContact)",
    },
    {
      metric: "satisfaction",
      value:
        FetchFeedbackInsightsData?.performance_overview?.find(
          (item) => item.metric === "Satisfaction",
        )?.value || 0,
      fill: "var(--color-satisfaction)",
    },
    {
      metric: "effortScore",
      value:
        FetchFeedbackInsightsData?.performance_overview?.find(
          (item) => item.metric === "Effort Score",
        )?.value || 0,
      fill: "var(--color-effortScore)",
    },
  ];

  const userActivityChartData = [
    {
      month: "january",
      guest: FetchUserMatrixData?.guest_user || 0,
      signed: FetchUserMatrixData?.signed_user || 0,
    },
  ];

  const conversationHistoryChartData =
    FetchConversationHistoryData?.points ?? [];

  return (
    <div className="flex flex-col gap-6 p-4">
      <PageHeading
        title="Dashboard"
        description="How your AI assistant is performing — engagement, efficiency, sentiment, and conversions at a glance."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DashboardFilters
              filters={filters}
              onChange={setFilters}
              lastUpdated={lastUpdated}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline">
                  <IconDownload />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={exportCsv}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={exportPdf}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        }
      />
      <section className="flex flex-col gap-4">
        <Typography variant="h4">Performance Summary</Typography>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {performanceSummaryMetrics.map((metric) => {
            const statusColors = {
              success: "bg-success/20 text-success",
              warning: "bg-orange/20 text-orange",
              neutral: "bg-muted text-muted-foreground",
              info: "bg-primary/10 text-primary",
              danger: "bg-red-100 text-red-600",
            };
            const value = (
              <Typography variant="h3" as="p">
                {metric.value}
              </Typography>
            );
            const statusBadge = (
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColors[metric.statusVariant]}`}
              >
                {metric.status}
              </span>
            );

            // The value and the status pill link independently (e.g. Active
            // Now's count goes to all active chats, its "needs a human"
            // sub-line to a different, filtered queue) — never one link
            // wrapping the whole card, which would force both to agree.
            return (
              <Card key={metric.label} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-1.5">
                    <Typography variant="muted" as="h3">
                      {metric.label}
                    </Typography>
                    <InfoIcon text={metric.infoText} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metric.href ? (
                    <Link href={metric.href} className="block">
                      {value}
                    </Link>
                  ) : (
                    value
                  )}
                </CardContent>
                <CardFooter className="justify-between gap-1.5">
                  {metric.statusHref ? (
                    <Link href={metric.statusHref}>{statusBadge}</Link>
                  ) : (
                    statusBadge
                  )}
                  {metric.trend && (
                    <Badge
                      variant="outline"
                      className={BADGE_TONE_STYLES[metric.trend.variant]}
                    >
                      {metric.trend.label}
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div data-export-chart="sentiment">
          <SentimentsPieChart data={sentimentPieChartData} />
        </div>
        <div data-export-chart="overview">
          <PerformanceRadialChart chartData={performanceRadialChartData} />
        </div>
        {/* Three cards on a two-column grid leave the third alone beside
            an empty cell; it takes the full row until three fit across. */}
        <div data-export-chart="activity" className="sm:max-lg:col-span-2">
          <GuestVsSignedUserRadialChart chartData={userActivityChartData} />
        </div>
      </div>
      <div data-export-chart="interaction">
        <ChatOrderFunnelSankey
          data={FetchChatOrderFunnelData}
          loading={FetchChatOrderFunnelIsLoading}
          periodLabel={periodLabel}
        />
        <CustomerInteractionLineChart
          chartData={conversationHistoryChartData}
          loading={FetchConversationHistoryIsLoading}
          granularity={granularity}
          onGranularityChange={handleGranularityChange}
          from={chartFrom}
          to={chartTo}
          onFromChange={setChartFrom}
          onToChange={setChartTo}
        />
      </div>
    </div>
  );
}
