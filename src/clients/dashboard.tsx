"use client";

import {
  CustomerInteractionLineChart,
  type Granularity,
} from "@/components/custom/customer-interaction-line-chart";
import { GuestVsSignedUserRadialChart } from "@/components/custom/guest-vs-signed-user-radial-chart";
import { PerformanceRadialChart } from "@/components/custom/performance-radial-char";
import { SentimentsPieChart } from "@/components/custom/sentiments-pie-chat";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FetchDashboard,
  FetchConversationHistory,
} from "@/redux/api-slice/dashboard-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";

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
    from.setMonth(0, 1);
  }
  return { from: toISODate(from), to: toISODate(to) };
};

const InfoIcon = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <IconInfoCircle className="w-4 h-4 text-muted-foreground cursor-pointer" />
    </TooltipTrigger>
    <TooltipContent>
      <p>{text}</p>
    </TooltipContent>
  </Tooltip>
);

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

  const { FetchConversationHistoryData, FetchConversationHistoryIsLoading } =
    useAppSelector(
      (state) => state.GetDashboardReducer.FetchConversationHistoryState,
    );

  const [granularity, setGranularity] = useState<Granularity>("hourly");
  const [from, setFrom] = useState(() => defaultRange("hourly").from);
  const [to, setTo] = useState(() => defaultRange("hourly").to);

  const handleGranularityChange = (next: Granularity) => {
    setGranularity(next);
    const range = defaultRange(next);
    setFrom(range.from);
    setTo(range.to);
  };

  useEffect(() => {
    if (!storeCode) return;
    // One consolidated request for all five summary widgets (feedback insights,
    // engagement, operational efficiency, user matrix, conversion rate) — see
    // /api/analytics/dashboard. Conversation history stays separate as it has
    // its own date-range controls.
    dispatch(FetchDashboard({ storeCode }));
  }, [dispatch, storeCode]);

  useEffect(() => {
    if (!storeCode || !from || !to) return;
    dispatch(
      FetchConversationHistory({
        storeCode,
        from,
        to,
        granularity,
        aggregated: true,
      }),
    );
  }, [dispatch, storeCode, from, to, granularity]);

  const performanceSummaryMetrics = [
    {
      label: "CSAT Score",
      value: `${FetchFeedbackInsightsData?.csat_score?.percentage || 0}%`,
      infoText:
        "Shows how satisfied customers were after interacting with the chatbot, based on submitted feedback and ratings.",
      status: "Customer Satisfaction",
      statusVariant: "info" as const,
    },
    {
      label: "Conversion Rate",
      value: `${FetchConversionRateData?.percentage || 0}%`,
      infoText:
        "Percentage of chatbot sessions where the user clicked a checkout link, out of all sessions in the selected period.",
      status: `${FetchConversionRateData?.converted_count || 0} of ${FetchConversionRateData?.total_count || 0} sessions`,
      statusVariant: "info" as const,
    },
    {
      label: "Total Sessions",
      value: FetchEngagementData?.total_threads?.toLocaleString() || "0",
      infoText:
        "Shows how many chatbot sessions happened in the selected time range, so you can quickly understand overall traffic volume.",
      status: "All Sessions",
      statusVariant: "neutral" as const,
    },
    {
      label: "Active Sessions",
      value: FetchEngagementData?.sessions_resolved?.toLocaleString() || "0",
      infoText:
        "Shows the number of sessions currently marked as active in the analytics data, helping you gauge current engagement.",
      status: "Currently Active",
      statusVariant: "neutral" as const,
    },
    {
      label: "Avg Response Time",
      value: `${FetchEngagementData?.avg_response_time_seconds?.toFixed(2) || "0.00"}s`,
      infoText:
        "Shows how quickly the chatbot usually replies after a customer message. Lower response times generally mean a smoother experience.",
      status: "Response Metric",
      statusVariant: "info" as const,
    },
    {
      label: "Avg Handle Time",
      value: `${FetchFeedbackInsightsData?.avg_handle_time?.value || 0}m`,
      infoText:
        "Shows the average time taken to handle a conversation from start to finish, including resolution.",
      status: "Per Session",
      statusVariant: "info" as const,
    },
    {
      label: "Resolution Rate",
      value: `${FetchOperationalEfficiencyData?.bot_resolution_rate?.percentage || 0}%`,
      infoText:
        "Shows the share of conversations that were fully resolved by the chatbot without needing handoff to a human agent.",
      status: "Resolution Metric",
      statusVariant: "info" as const,
    },
    {
      label: "Escalation Rate",
      value: `${FetchOperationalEfficiencyData?.escalation_rate?.percentage || 0}%`,
      infoText:
        "Shows the share of conversations that needed to be escalated to a human agent, which can highlight where the bot needs support.",
      status: "Escalation Metric",
      statusVariant: "info" as const,
    },
  ];

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
    <>
      <div className="px-6 py-2">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceSummaryMetrics.map((metric) => {
            const statusColors = {
              success: "bg-success/20 text-success",
              warning: "bg-orange/20 text-orange",
              neutral: "bg-muted text-muted-foreground",
              info: "bg-primary/10 text-primary",
            };
            return (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none text-muted-foreground">
                    {metric.label}
                  </span>
                  <InfoIcon text={metric.infoText} />
                </div>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {metric.value}
                </p>
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColors[metric.statusVariant]}`}
                >
                  {metric.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6 py-4">
        <SentimentsPieChart data={sentimentPieChartData} />
        <PerformanceRadialChart chartData={performanceRadialChartData} />
        <GuestVsSignedUserRadialChart chartData={userActivityChartData} />
      </div>
      <div className="px-6 py-4">
        <CustomerInteractionLineChart
          chartData={conversationHistoryChartData}
          loading={FetchConversationHistoryIsLoading}
          granularity={granularity}
          onGranularityChange={handleGranularityChange}
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
        />
      </div>
    </>
  );
}
