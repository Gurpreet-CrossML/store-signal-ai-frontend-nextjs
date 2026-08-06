import DailyUsageChart from "@/components/custom/ai-usage/daily-usage-chart";
import LatencyTrendChart from "@/components/custom/ai-usage/latency-trend-chart";
import TokenSplitChart from "@/components/custom/ai-usage/token-split-chart";
import WorkflowCostChart from "@/components/custom/ai-usage/workflow-cost-chart";
import type { AIUsageResponse } from "@/redux/api-slice/ai-usage-slice";

/**
 * Arranges the summary and trend visualizations for the AI usage dashboard.
 */
export default function AIUsageCharts({
  data,
  from,
  to,
}: {
  data: {
    summary: AIUsageResponse["summary"];
    charts: Pick<
      AIUsageResponse["charts"],
      "daily_usage" | "workflow_costs" | "latency_trend"
    >;
  };
  from?: string;
  to?: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DailyUsageChart data={data.charts.daily_usage} from={from} to={to} />
      <TokenSplitChart summary={data.summary} />
      <WorkflowCostChart data={data.charts.workflow_costs} />
      <LatencyTrendChart data={data.charts.latency_trend} from={from} to={to} />
    </div>
  );
}
