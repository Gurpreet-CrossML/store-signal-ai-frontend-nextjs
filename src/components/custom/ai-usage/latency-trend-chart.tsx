"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
  latency: { label: "Average latency (ms)", color: "var(--chart-4)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function LatencyTrendChart({
  data,
}: {
  data: AIUsageResponse["charts"]["latency_trend"];
}) {
  const points = data.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${item.date}T00:00:00Z`)),
  }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Latency trend</CardTitle>
        <CardDescription>Daily average agent latency in milliseconds</CardDescription>
      </CardHeader>
      <CardContent>
        {points.length ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart accessibilityLayer data={points} margin={{ right: 16 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${compact.format(value)} ms`}
                width={64}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="var(--color-latency)"
                strokeWidth={2.5}
                dot={points.length < 20}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState />
        )}
      </CardContent>
    </Card>
  );
}
