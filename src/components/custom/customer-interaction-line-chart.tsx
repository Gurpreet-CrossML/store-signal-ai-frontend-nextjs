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
  previous_label?: string | null;
};

const seriesLabels: Record<Granularity, [string, string]> = {
  hourly: ["Today", "Yesterday"],
  weekly: ["Last 7 days", "Previous 7 days"],
  monthly: ["Selected months", "Previous months"],
};

const subtitleMap: Record<Granularity, string> = {
  hourly: "User queries per hour",
  weekly: "User queries per day",
  monthly: "User queries by month",
};

const autoRangeLabel: Record<Granularity, string> = {
  hourly: "Today",
  weekly: "Last 7 days",
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
      // The current series' purple, lighter, so the comparison recedes.
      color: "color-mix(in oklch, var(--chart-1) 45%, transparent)",
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
                padding={{ left: 12, right: 12 }}
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
                    // Hourly: "2 pm–3 pm" over Today / Yesterday rows (both
                    // share the hour). Weekly/monthly: each row names its own
                    // date, so no header is needed.
                    hideLabel={granularity !== "hourly"}
                    labelFormatter={(label) => formatPeakHour(String(label))}
                    formatter={(value, _name, item) => (
                      <>
                        <div
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ background: item.color }}
                        />
                        <div className="flex flex-1 justify-between gap-4 leading-none">
                          <span className="text-muted-foreground">
                            {granularity === "hourly"
                              ? chartConfig[item.dataKey as keyof typeof chartConfig]
                                  ?.label
                              : item.dataKey === "previous"
                                ? item.payload.previous_label
                                : item.payload.label}
                          </span>
                          {value != null && (
                            <span className="font-mono font-medium text-foreground tabular-nums">
                              {Number(value).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </>
                    )}
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
                // Filled, so a lone point stays visible.
                dot={
                  granularity !== "hourly" && {
                    r: 4,
                    fill: "var(--color-value)",
                  }
                }
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
