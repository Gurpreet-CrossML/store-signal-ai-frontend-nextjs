"use client";

import * as React from "react";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
  usage: {
    label: "Total usage",
    color: "var(--chart-3)",
  },
  input_tokens: {
    label: "Total Input tokens",
    color: "var(--chart-2)",
  },
  output_tokens: {
    label: "Total Output tokens",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type ActiveChart = keyof typeof chartConfig;

/**
 * Renders daily agent usage and input/output token totals.
 */
export default function DailyUsageChart({
  data,
  from,
  to,
}: {
  data: AIUsageResponse["charts"]["daily_usage"];
  from?: string;
  to?: string;
}) {
  const [activeChart, setActiveChart] = React.useState<ActiveChart>("usage");
  const chartData = React.useMemo(() => {
    if (!from || !to) return data;

    const pointsByDate = new Map(data.map((item) => [item.date, item]));
    return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map(
      (date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        return (
          pointsByDate.get(dateKey) ?? {
            date: dateKey,
            usage: 0,
            input_tokens: 0,
            output_tokens: 0,
          }
        );
      },
    );
  }, [data, from, to]);
  const totals = React.useMemo(
    () => ({
      // Numeric database fields can be serialized as strings by the API.
      usage: data.reduce((sum, item) => sum + Number(item.usage || 0), 0),
      input_tokens: data.reduce(
        (sum, item) => sum + Number(item.input_tokens || 0),
        0,
      ),
      output_tokens: data.reduce(
        (sum, item) => sum + Number(item.output_tokens || 0),
        0,
      ),
    }),
    [data],
  );

  return (
    <Card className="py-0 lg:col-span-2">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>AI Token usage</CardTitle>
          <CardDescription>
            Agent calls and input/output tokens for each day
          </CardDescription>
        </div>
        <div className="flex">
          {(["usage", "input_tokens", "output_tokens"] as ActiveChart[]).map(
            (chart) => (
              <button
                key={chart}
                type="button"
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {totals[chart].toLocaleString()}
                </span>
              </button>
            ),
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {chartData.length ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                tickFormatter={(value) =>
                  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[180px]"
                    labelFormatter={(value) =>
                      new Date(`${value}T00:00:00Z`).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        },
                      )
                    }
                  />
                }
              />
              <Bar
                dataKey={activeChart}
                fill={`var(--color-${activeChart})`}
                maxBarSize={96}
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
