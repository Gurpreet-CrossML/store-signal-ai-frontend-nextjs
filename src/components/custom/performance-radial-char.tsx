"use client";

import { LabelList, RadialBar, RadialBarChart } from "recharts";

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

const chartConfig = {
  responseTime: {
    label: "Response Time",
    color: "var(--chart-1)",
  },
  resolutionRate: {
    label: "Resolution Rate",
    color: "var(--chart-2)",
  },
  firstContact: {
    label: "First Contact",
    color: "var(--chart-3)",
  },
  satisfaction: {
    label: "Satisfaction",
    color: "var(--chart-4)",
  },
  effortScore: {
    label: "Effort Score",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function PerformanceRadialChart({
  chartData,
}: {
  chartData: { metric: string; value: number; fill: string }[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center">
        <CardTitle className="flex items-center gap-1.5">
          Performance Overview
          <InfoIcon text="Compares key service metrics — response time, resolution rate, first contact, satisfaction, and effort score — in a single view to spot strengths and gaps." />
        </CardTitle>
        <CardDescription>Key service metrics at a glance</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {/* The legend sits inside the chart's square, as the sentiment
            card's does, so this card is exactly as tall as its neighbours.
            The rings are drawn a little smaller and higher to leave it room. */}
        <div className="relative mx-auto aspect-square w-full max-w-[250px]">
          <ChartContainer config={chartConfig} className="size-full">
            <RadialBarChart
              data={chartData}
              cy="40%"
              startAngle={-90}
              endAngle={380}
              innerRadius={22}
              outerRadius={80}
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="metric" />}
              />
              <RadialBar dataKey="value" background>
                {/* Hidden on screen: five labels curved along bars this thin
                  overlap into noise at every width, so the legend below
                  names them instead. Kept in the SVG because the dashboard
                  export copies this chart's markup and rewrites these
                  labels. */}
                <LabelList
                  position="insideStart"
                  dataKey="metric"
                  className="hidden fill-white capitalize mix-blend-luminosity"
                  fontSize={11}
                />
              </RadialBar>
            </RadialBarChart>
          </ChartContainer>
          <ul className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {chartData.map((item) => (
              <li key={item.metric} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.fill }}
                />
                {chartConfig[item.metric as keyof typeof chartConfig]?.label ??
                  item.metric}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
