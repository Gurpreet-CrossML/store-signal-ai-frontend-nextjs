"use client";

import { eachDayOfInterval, format, parseISO } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import ChartEmptyState from "@/components/custom/ai-usage/chart-empty-state";
import { InfoIcon } from "@/components/custom/info-icon";
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
  latency: { label: "Average latency (ms)", color: "var(--chart-3)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Renders the daily average AI-agent latency as a time-series line chart. */
export default function LatencyTrendChart({
  data,
  from,
  to,
}: {
  data: AIUsageResponse["charts"]["latency_trend"];
  from?: string;
  to?: string;
}) {
  const rangeData = (() => {
    if (!from || !to) return data;

    const pointsByDate = new Map(data.map((item) => [item.date, item]));
    return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map(
      (date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        return pointsByDate.get(dateKey) ?? { date: dateKey, latency: null };
      },
    );
  })();
  const points = rangeData.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    }).format(new Date(`${item.date}T00:00:00Z`)),
  }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Latency Trend
          <InfoIcon text="Average time agent calls took to complete each day. A rising line can signal slower models or heavier workflows." />
        </CardTitle>
        <CardDescription>
          Average agent response time per day, in milliseconds
        </CardDescription>
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
                interval={0}
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
