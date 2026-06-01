"use client"

import { LabelList, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = ""

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
} satisfies ChartConfig

export function PerformanceRadialChart({ chartData }: { chartData: { metric: string, value: number, fill: string }[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Label</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
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
  )
}
