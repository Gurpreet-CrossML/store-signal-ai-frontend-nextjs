"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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
  cost: { label: "Cost (USD)", color: "var(--chart-3)" },
  label: { color: "var(--primary-foreground)" },
} satisfies ChartConfig;

/** Converts a backend workflow identifier into a human-readable title. */
function formatWorkflowName(value: unknown) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Renders estimated AI usage cost grouped by workflow in US dollars. */
export default function WorkflowCostChart({
  data,
}: {
  data: AIUsageResponse["charts"]["workflow_costs"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost by workflow</CardTitle>
        <CardDescription>Highest-spending workflows in USD</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{ right: 76 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="workflow"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                hide
              />
              <XAxis dataKey="cost" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={formatWorkflowName}
                    formatter={(value) => (
                      <>
                        <span className="text-muted-foreground">
                          Cost (USD)
                        </span>
                        <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
                          ${Number(value ?? 0).toFixed(2)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="cost" fill="var(--color-cost)" radius={4}>
                <LabelList
                  dataKey="workflow"
                  position="insideLeft"
                  offset={8}
                  className="fill-(--color-label)"
                  fontSize={12}
                  formatter={formatWorkflowName}
                />
                <LabelList
                  dataKey="cost"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value) => `$${Number(value ?? 0).toFixed(2)}`}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState />
        )}
      </CardContent>
    </Card>
  );
}
