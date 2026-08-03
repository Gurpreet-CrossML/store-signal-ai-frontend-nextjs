"use client";

import { Label, Pie, PieChart } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AIUsageSummary } from "@/redux/api-slice/ai-usage-slice";

const chartConfig = {
  input: { label: "Input tokens", color: "var(--chart-4)" },
  output: { label: "Output tokens", color: "var(--chart-1)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function TokenSplitChart({ summary }: { summary: AIUsageSummary }) {
  const data = [
    { type: "input", tokens: summary.input_tokens, fill: "var(--color-input)" },
    { type: "output", tokens: summary.output_tokens, fill: "var(--color-output)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token split</CardTitle>
        <CardDescription>Input and output tokens across agent calls</CardDescription>
      </CardHeader>
      <CardContent>
        {summary.total_tokens ? (
          <ChartContainer config={chartConfig} className="mx-auto h-[280px] w-full">
            <PieChart accessibilityLayer>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
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
                            {compact.format(summary.total_tokens)}
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
          <ChartEmptyState />
        )}
      </CardContent>
    </Card>
  );
}
