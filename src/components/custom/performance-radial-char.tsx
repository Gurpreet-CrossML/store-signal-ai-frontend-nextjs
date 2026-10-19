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
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={-90}
            endAngle={380}
            innerRadius={30}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="metric" />}
            />
            <RadialBar dataKey="value" background>
              <LabelList
                position="insideStart"
                dataKey="metric"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
