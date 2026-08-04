import AgentCallsChart from "@/components/custom/ai-usage/agent-calls-chart";
import DailyUsageChart from "@/components/custom/ai-usage/daily-usage-chart";
import LatencyTrendChart from "@/components/custom/ai-usage/latency-trend-chart";
import ModelTokensChart from "@/components/custom/ai-usage/model-tokens-chart";
import TokenSplitChart from "@/components/custom/ai-usage/token-split-chart";
import WorkflowCostChart from "@/components/custom/ai-usage/workflow-cost-chart";
import type { AIUsageResponse } from "@/redux/api-slice/ai-usage-slice";

export default function AIUsageCharts({
  data,
  agentWorkflow,
  onAgentWorkflowChange,
}: {
  data: AIUsageResponse;
  agentWorkflow: string;
  onAgentWorkflowChange: (workflow: string) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DailyUsageChart data={data.charts.daily_usage} />
      <TokenSplitChart summary={data.summary} />
      <WorkflowCostChart data={data.charts.workflow_costs} />
      <AgentCallsChart
        data={data.charts.agent_calls}
        workflows={data.charts.agent_workflows}
        selectedWorkflow={agentWorkflow}
        onWorkflowChange={onAgentWorkflowChange}
      />
      <ModelTokensChart data={data.charts.model_tokens} />
      <LatencyTrendChart data={data.charts.latency_trend} />
    </div>
  );
}
