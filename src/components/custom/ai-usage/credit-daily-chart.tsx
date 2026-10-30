"use client";

import * as React from "react";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import ChartEmptyState from "@/components/custom/ai-usage/chart-empty-state";
import {
  FEATURE_GROUPS,
  FEATURE_INFO,
} from "@/components/custom/ai-usage/feature-groups";
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
  type ChartConfig,
} from "@/components/ui/chart";
import type { DailyCreditPoint } from "@/redux/api-slice/ai-usage-slice";

const chartConfig = {
  credits_charged: { label: "Credits", color: "var(--chart-3)" },
} satisfies ChartConfig;

type ChartPoint = {
  date: string;
  credits_charged: number;
  features: Record<string, number>;
};

/**
 * The hovered day: its total, then each capability group with its credits
 * and the features under it, largest first.
 */
function DayBreakdown({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}) {
  const day = payload?.[0]?.payload;
  if (!active || !day) return null;
  const groups = FEATURE_GROUPS.map((group) => {
    const rows = Object.keys(group.features)
      .filter((feature) => day.features[feature])
      .map((feature) => ({
        name: FEATURE_INFO[feature].name,
        credits: day.features[feature],
      }))
      .sort((a, b) => b.credits - a.credits);
    return {
      title: group.title,
      credits: rows.reduce((sum, row) => sum + row.credits, 0),
      rows,
    };
  })
    .filter((group) => group.credits)
    .sort((a, b) => b.credits - a.credits);
  return (
    <div className="grid min-w-52 gap-2 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="flex justify-between gap-4 font-medium">
        <span>{format(parseISO(day.date), "MMM d, yyyy")}</span>
        <span className="tabular-nums">
          {day.credits_charged.toLocaleString()} credits
        </span>
      </div>
      {groups.map((group) => (
        <div key={group.title} className="grid gap-0.5">
          <div className="flex justify-between gap-4 font-medium">
            <span>{group.title}</span>
            <span className="font-semibold text-primary tabular-nums">
              {group.credits.toLocaleString()}
            </span>
          </div>
          {group.rows.map((row) => (
            <div key={row.name} className="flex justify-between gap-4 pl-2">
              <span className="text-muted-foreground">{row.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {row.credits.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Credits charged per day across the selected range, empty days included. */
export default function CreditDailyChart({
  data,
  from,
  to,
}: {
  data: DailyCreditPoint[];
  from: string;
  to: string;
}) {
  const chartData = React.useMemo<ChartPoint[]>(() => {
    const byDate = new Map(data.map((item) => [item.date, item]));
    return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map(
      (date) => {
        const key = format(date, "yyyy-MM-dd");
        const item = byDate.get(key);
        return {
          date: key,
          credits_charged: Number(item?.credits_charged) || 0,
          features: item?.features ?? {},
        };
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
          <InfoIcon text="Credits charged on each day of the selected period. Hover a day to see which capabilities used them." />
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
            {/* Top margin leaves room for the labels above the bars. */}
            <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                tickFormatter={(value) => format(parseISO(value), "MMM d")}
              />
              <ChartTooltip content={<DayBreakdown />} />
              <Bar
                dataKey="credits_charged"
                fill="var(--color-credits_charged)"
                maxBarSize={48}
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="credits_charged"
                  position="top"
                  offset={6}
                  className="fill-foreground"
                  fontSize={11}
                  // Quiet days stay unlabelled.
                  formatter={(value) =>
                    Number(value) ? Number(value).toLocaleString() : ""
                  }
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
