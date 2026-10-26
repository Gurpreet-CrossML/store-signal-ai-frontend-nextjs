"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export type Granularity = "hourly" | "weekly" | "monthly";
// value is null for hours that haven't happened yet; previous is the same
// bucket one period back.
export type ChartPoint = {
  label: string;
  value: number | null;
  previous?: number | null;
};

const seriesLabels: Record<Granularity, [string, string]> = {
  hourly: ["Today", "Yesterday"],
  weekly: ["This week", "Last week"],
  monthly: ["Selected months", "Previous months"],
};

const subtitleMap: Record<Granularity, string> = {
  hourly: "User queries per hour",
  weekly: "User queries per day",
  monthly: "User queries by month",
};

const autoRangeLabel: Record<Granularity, string> = {
  hourly: "Today",
  weekly: "This week",
  monthly: "Custom range",
};

const formatPeakHour = (label: string) => {
  const match = label.trim().match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (!match) return label;

  const hour =
    (Number(match[1]) % 12) + (match[2].toUpperCase() === "PM" ? 12 : 0);
  const formatHour = (value: number) =>
    `${value % 12 || 12} ${value >= 12 ? "pm" : "am"}`;

  return `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`;
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
  const peakPoint =
    granularity === "hourly"
      ? chartData.reduce<ChartPoint | null>(
          (peak, point) =>
            peak === null || (point.value ?? 0) > (peak.value ?? 0)
              ? point
              : peak,
          null,
        )
      : null;
  const chartConfig = {
    value: { label: seriesLabels[granularity][0], color: "var(--chart-1)" },
    previous: {
      label: seriesLabels[granularity][1],
      color: "var(--muted-foreground)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-1.5">
            Customer Interaction Analytics
            <InfoIcon text="Tracks how many customer conversations happened over time for the selected date range and granularity, so you can spot trends and peak periods." />
          </CardTitle>
          <CardDescription>
            {(peakPoint?.value ?? 0) > 0 && peakPoint
              ? `Peak at ${formatPeakHour(peakPoint.label)}, plan agent shifts around it`
              : subtitleMap[granularity]}
          </CardDescription>
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
            <DateRangePicker
              from={from}
              to={to}
              onRangeChange={(nextFrom, nextTo) => {
                onFromChange(nextFrom);
                onToChange(nextTo);
              }}
              disabled={{ after: new Date() }}
            />
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
                interval={granularity === "weekly" ? 0 : "preserveStartEnd"}
                tickFormatter={(label, i) =>
                  granularity === "hourly" && i % 3 !== 0 ? "" : label
                }
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={32}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    // "01 PM" covers 1:00–1:59, so show it as a range.
                    labelFormatter={(label) => formatPeakHour(String(label))}
                  />
                }
              />
              <ChartLegend
                verticalAlign="top"
                align="right"
                content={<ChartLegendContent />}
              />
              <Line
                dataKey="previous"
                type="monotone"
                stroke="var(--color-previous)"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4 }}
              />
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
