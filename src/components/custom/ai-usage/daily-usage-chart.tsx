"use client";

import * as React from "react";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
import type { DailyUsagePoint } from "@/redux/api-slice/ai-usage-slice";

const chartConfig = {
  credits_charged: { label: "Credits", color: "var(--chart-3)" },
} satisfies ChartConfig;

/** Credits charged per day across the selected range, empty days included. */
export default function DailyUsageChart({
  data,
  from,
  to,
}: {
  data: DailyUsagePoint[];
  from: string;
  to: string;
}) {
  const chartData = React.useMemo(() => {
    const creditsByDate = new Map(
      data.map((item) => [item.date, Number(item.credits_charged) || 0]),
    );
    return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map(
      (date) => {
        const key = format(date, "yyyy-MM-dd");
        return { date: key, credits_charged: creditsByDate.get(key) ?? 0 };
      },
    );
  }, [data, from, to]);
  const days = chartData.length;
  const total = chartData.reduce((sum, item) => sum + item.credits_charged, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Day by day
          <InfoIcon text="Credits charged on each day of the selected period." />
        </CardTitle>
        <CardDescription>
          {days > 1
            ? `About ${Math.round(total / days).toLocaleString()} credits a day on average.`
            : `${total.toLocaleString()} credits on this day.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[240px] w-full"
          >
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                tickFormatter={(value) => format(parseISO(value), "MMM d")}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      format(parseISO(String(value)), "MMM d, yyyy")
                    }
                  />
                }
              />
              <Bar
                dataKey="credits_charged"
                fill="var(--color-credits_charged)"
                maxBarSize={48}
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
