"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import ChartEmptyState from "@/components/custom/ai-usage/chart-empty-state";
import {
  Card,
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
import type { AIUsageResponse } from "@/redux/api-slice/ai-usage-slice";

const chartConfig = {
  calls: { label: "Agent calls", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function AgentCallsChart({
  data,
}: {
  data: AIUsageResponse["charts"]["agent_calls"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent calls</CardTitle>
        <CardDescription>Workflow invocations grouped by agent</CardDescription>
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
