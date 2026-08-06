"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import ChartEmptyState from "@/components/custom/ai-usage/chart-empty-state";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AIUsageResponse } from "@/redux/api-slice/ai-usage-slice";

const chartConfig = {
  calls: { label: "Agent calls", color: "var(--chart-3)" },
} satisfies ChartConfig;

const ALL_WORKFLOWS = "all";

/** Converts a backend identifier into a human-readable title. */
function formatName(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Renders agent call totals and provides a workflow selector that refreshes
 * the chart through the parent callback.
 */
export default function AgentCallsChart({
  data,
  workflows,
  selectedWorkflow,
  onWorkflowChange,
}: {
  data: AIUsageResponse["charts"]["agent_calls"];
  workflows: string[];
  selectedWorkflow: string;
  onWorkflowChange: (workflow: string) => void;
}) {
  const activeWorkflow = selectedWorkflow || ALL_WORKFLOWS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent calls</CardTitle>
        <CardDescription>Workflow invocations grouped by agent</CardDescription>
        <CardAction>
          <Select
            value={activeWorkflow}
            onValueChange={(value) =>
              onWorkflowChange(value === ALL_WORKFLOWS ? "" : value)
            }
          >
            <SelectTrigger size="sm" className="max-w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={ALL_WORKFLOWS}>All workflows</SelectItem>
              {workflows.map((workflow) => (
                <SelectItem key={workflow} value={workflow}>
                  {formatName(workflow)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="agent"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={65}
                tickFormatter={(value) =>
                  value.length > 14 ? `${value.slice(0, 13)}…` : value
                }
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                dataKey="calls"
                fill="var(--color-calls)"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState />
        )}
      </CardContent>
    </Card>
  );
}
