"use client";

import { SentimentsPieChart } from "@/components/custom/sentiments-pie-chat";
import {
  FetchFeedbackInsights,
  FetchConversation,
  FetchEngagement, 
  FetchOperationalEfficiency, 
  FetchUserMatrix, 
  FetchConversionRate, 
  FetchQueryCategoryInsights 
} from "@/redux/api-slice/dashboard-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useEffect } from "react";


export default function Dashboard() {
  const dispatch = useAppDispatch();
  const storeCode = useAppSelector(
    (state) => state.GetStoresReducer.selectedStore
  );

  const { FetchFeedbackInsightsData, FetchFeedbackInsightsIsLoading } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchFeedbackInsightsState
  );

  const { FetchConversationData, FetchConversationDataIsLoading } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchConversationDataState
  );

  const { FetchEngagementData, FetchEngagementDataIsLoading } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchEngagementDataState
  );

  const { FetchOperationalEfficiencyData, FetchOperationalEfficiencyDataIsLoading } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchOperationalEfficiencyDataState
  );

  const { FetchUserMatrixData, FetchUserMatrixIsLoading } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchUserMatrixState
  );

  const { FetchConversionRateData, FetchConversionRateDataIsLoading } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchConversionRateDataState
  );

  const { FetchQueryCategoryInsightsData, FetchQueryCategoryInsightsIsLoading } = useAppSelector(
    (state) => state.GetDashboardReducer.FetchQueryCategoryInsightsState
  );

  
  useEffect(() => {
    if (!storeCode) return;
    dispatch(FetchFeedbackInsights({ storeCode }));
    dispatch(FetchConversation({ storeCode }));
    dispatch(FetchEngagement({ storeCode }));
    dispatch(FetchOperationalEfficiency({ storeCode }));
    dispatch(FetchUserMatrix({ storeCode }));
    dispatch(FetchConversionRate({ storeCode }));
    dispatch(FetchQueryCategoryInsights({ storeCode }));
  }, [dispatch, storeCode]);

  const performanceSummaryMetrics = [
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
      score: FetchFeedbackInsightsData?.feedback_distribution?.positive?.value || 0,
      fill: "var(--color-positive)",
    },
    {
      sentiment: "neutral",
      score: FetchFeedbackInsightsData?.feedback_distribution?.neutral?.value || 0,
      fill: "var(--color-neutral)",
    },
    {
      sentiment: "negative",
      score: FetchFeedbackInsightsData?.feedback_distribution?.negative?.value || 0,
      fill: "var(--color-negative)",
    },
  ];
  
  return (
    <>
      <div className="px-6 py-2">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none text-muted-foreground">
                CSAT Score
              </span>
              {/* <InfoIcon text="Shows how satisfied customers were after interacting with the chatbot, based on submitted feedback and ratings." /> */}
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {`${FetchFeedbackInsightsData?.csat_score?.percentage || 0}%`}
            </p>
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
              Customer Satisfaction
            </span>
          </div>
          {/* Conversion Rate  */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none text-muted-foreground">
                Conversion Rate
              </span>
              {/* <InfoIcon text="Percentage of chatbot sessions where the user clicked a checkout link, out of all sessions in the selected period." /> */}
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {`${FetchConversionRateData?.percentage || 0}%`}
            </p>
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary">
              {FetchConversionRateData?.converted_count || 0} of{" "}
              {FetchConversionRateData?.total_count || 0} sessions
            </span>
          </div>
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
                  {/* <InfoIcon text={metric.infoText} /> */}
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
      </div>
    </>
  )
}
