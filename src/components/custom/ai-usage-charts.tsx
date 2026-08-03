"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

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

const tokenConfig = {
  input: { label: "Input tokens", color: "var(--chart-4)" },
  output: { label: "Output tokens", color: "var(--chart-1)" },
  input_tokens: { label: "Input tokens", color: "var(--chart-4)" },
  output_tokens: { label: "Output tokens", color: "var(--chart-1)" },
} satisfies ChartConfig;

const costConfig = {
  cost: { label: "Cost (USD)", color: "var(--chart-4)" },
} satisfies ChartConfig;

const callsConfig = {
  calls: { label: "Agent calls", color: "var(--chart-3)" },
} satisfies ChartConfig;

const latencyConfig = {
  latency: { label: "Average latency (ms)", color: "var(--chart-4)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      No usage data for the selected filters
    </div>
  );
}

export default function AIUsageCharts({ data }: { data: AIUsageResponse }) {
  const tokenSplit = [
    {
      type: "input",
      tokens: data.summary.input_tokens,
      fill: "var(--color-input)",
    },
    {
      type: "output",
      tokens: data.summary.output_tokens,
      fill: "var(--color-output)",
    },
  ];
  const latency = data.charts.latency_trend.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${item.date}T00:00:00Z`)),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Token split</CardTitle>
          <CardDescription>Input and output tokens across agent calls</CardDescription>
        </CardHeader>
        <CardContent>
          {data.summary.total_tokens ? (
            <ChartContainer config={tokenConfig} className="mx-auto h-[280px] w-full">
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={tokenSplit}
                  dataKey="tokens"
                  nameKey="type"
                  innerRadius={72}
                  outerRadius={105}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 4}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {compact.format(data.summary.total_tokens)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 18}
                              className="fill-muted-foreground text-xs"
                            >
                              Total tokens
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="type" />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost by workflow</CardTitle>
          <CardDescription>Highest-spending workflows in USD</CardDescription>
        </CardHeader>
        <CardContent>
          {data.charts.workflow_costs.length ? (
            <ChartContainer config={costConfig} className="h-[280px] w-full">
              <BarChart
                accessibilityLayer
                data={data.charts.workflow_costs}
                layout="vertical"
                margin={{ left: 8, right: 24 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis
                  dataKey="workflow"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tickFormatter={(value) =>
                    value.length > 16 ? `${value.slice(0, 15)}…` : value
                  }
                />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <div className="flex min-w-32 justify-between gap-4">
                          <span className="text-muted-foreground">Cost</span>
                          <span className="font-mono font-medium">
                            ${Number(value).toFixed(6)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="cost" fill="var(--color-cost)" radius={5} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent calls</CardTitle>
          <CardDescription>Workflow invocations grouped by agent</CardDescription>
        </CardHeader>
        <CardContent>
          {data.charts.agent_calls.length ? (
            <ChartContainer config={callsConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={data.charts.agent_calls}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="agent"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={65}
                  tickFormatter={(value) =>
                    value.length > 14 ? `${value.slice(0, 13)}…` : value
                  }
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="calls" fill="var(--color-calls)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tokens by model</CardTitle>
          <CardDescription>Input and output volume for each model</CardDescription>
        </CardHeader>
        <CardContent>
          {data.charts.model_tokens.length ? (
            <ChartContainer config={tokenConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={data.charts.model_tokens}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="model"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  interval={0}
                  tickFormatter={(value) => {
                    const name = value.includes(":") ? value.split(":").at(-1) : value;
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
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Latency trend</CardTitle>
          <CardDescription>Daily average agent latency in milliseconds</CardDescription>
        </CardHeader>
        <CardContent>
          {latency.length ? (
            <ChartContainer config={latencyConfig} className="h-[300px] w-full">
              <LineChart accessibilityLayer data={latency} margin={{ right: 16 }}>
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
                  dot={latency.length < 20}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
