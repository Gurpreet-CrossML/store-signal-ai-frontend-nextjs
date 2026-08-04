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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AIUsageResponse } from "@/redux/api-slice/ai-usage-slice";

const chartConfig = {
  input_tokens: { label: "Input tokens", color: "var(--chart-4)" },
  output_tokens: { label: "Output tokens", color: "var(--chart-1)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Renders stacked input and output token totals grouped by AI model. */
export default function ModelTokensChart({
  data,
}: {
  data: AIUsageResponse["charts"]["model_tokens"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokens by model</CardTitle>
        <CardDescription>
          Input and output volume for each model
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="model"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval={0}
                tickFormatter={(value) => {
                  const name = value.includes(":")
                    ? value.split(":").at(-1)
                    : value;
                  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => compact.format(value)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="input_tokens"
                stackId="tokens"
                fill="var(--color-input_tokens)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="output_tokens"
                stackId="tokens"
                fill="var(--color-output_tokens)"
                radius={[4, 4, 0, 0]}
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
