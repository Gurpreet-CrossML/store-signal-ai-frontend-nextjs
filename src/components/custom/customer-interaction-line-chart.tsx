"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export const description = "Customer interaction analytics line chart";

export type Granularity = "hourly" | "weekly" | "monthly";
export type ChartPoint = { label: string; value: number };

const chartConfig = {
  value: {
    label: "User Queries",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const subtitleMap: Record<Granularity, string> = {
  hourly: "User queries by hour of day",
  weekly: "User queries by calendar week",
  monthly: "User queries by month",
};

const autoRangeLabel: Record<Granularity, string> = {
  hourly: "Last 7 days",
  weekly: "Last 4 weeks",
  monthly: "Custom range",
};

export function CustomerInteractionLineChart({
  chartData,
  loading = false,
  granularity,
  onGranularityChange,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  chartData: ChartPoint[];
  loading?: boolean;
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Customer Interaction Analytics</CardTitle>
          <CardDescription>{subtitleMap[granularity]}</CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={granularity}
            onValueChange={(value) => onGranularityChange(value as Granularity)}
          >
            <SelectTrigger className="w-[120px]" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          {granularity === "monthly" ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
                className="h-8 w-[150px]"
              />
              <span className="text-sm text-muted-foreground">→</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                className="h-8 w-[150px]"
              />
            </div>
          ) : (
            <span className="rounded-md border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground">
              {autoRangeLabel[granularity]}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="flex h-[300px] items-center justify-center gap-2 text-muted-foreground">
            <Spinner className="size-5" />
            Loading…
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 0, right: 16, top: 8, bottom: 4 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                opacity={0.3}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                interval={
                  granularity === "hourly"
                    ? "preserveStartEnd"
                    : granularity === "weekly"
                      ? Math.max(0, Math.ceil(chartData.length / 6) - 1)
                      : "preserveStartEnd"
                }
                tickFormatter={(label, i) =>
                  granularity === "hourly" && i % 3 !== 0 ? "" : label
                }
                angle={
                  granularity === "weekly" && chartData.length > 8 ? -35 : 0
                }
                textAnchor={
                  granularity === "weekly" && chartData.length > 8
                    ? "end"
                    : "middle"
                }
                height={
                  granularity === "weekly" && chartData.length > 8 ? 50 : 30
                }
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={32}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={granularity !== "hourly"}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No user queries found for selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
