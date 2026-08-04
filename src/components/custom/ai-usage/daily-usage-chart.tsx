"use client";

import * as React from "react";
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
    color: "var(--chart-4)",
  },
  consumption: {
    label: "Total consumption",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type ActiveChart = keyof typeof chartConfig;

/**
 * Renders daily agent usage or token consumption and lets the user switch
 * between the two series.
 */
export default function DailyUsageChart({
  data,
}: {
  data: AIUsageResponse["charts"]["daily_usage"];
}) {
  const [activeChart, setActiveChart] = React.useState<ActiveChart>("usage");
  const totals = React.useMemo(
    () => ({
      // Numeric database fields can be serialized as strings by the API.
      usage: data.reduce((sum, item) => sum + Number(item.usage || 0), 0),
      consumption: data.reduce(
        (sum, item) => sum + Number(item.consumption || 0),
        0,
      ),
    }),
    [data],
  );

  return (
    <Card className="py-0 lg:col-span-2">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>Daily AI usage</CardTitle>
          <CardDescription>
            Agent calls and token consumption for each day
          </CardDescription>
        </div>
        <div className="flex">
          {(["usage", "consumption"] as ActiveChart[]).map((chart) => (
            <button
              key={chart}
              type="button"
              data-active={activeChart === chart}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveChart(chart)}
            >
              <span className="text-xs text-muted-foreground">
                {chartConfig[chart].label}
              </span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {totals[chart].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {data.length ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
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
