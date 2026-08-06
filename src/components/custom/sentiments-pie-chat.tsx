"use client";

import { Pie, PieChart } from "recharts";

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

const chartConfig = {
  positive: {
    label: "Positive",
    color: "hsl(142, 71%, 45%)",
  },
  neutral: {
    label: "Neutral",
    color: "hsl(38, 92%, 50%)",
  },
  negative: {
    label: "Negative",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

export function SentimentsPieChart({
  data,
}: {
  data: { sentiment: string; score: number; fill: string }[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center">
        <CardTitle className="flex items-center gap-1.5">
          Sentiment Distribution
          <InfoIcon text="Breaks down customer feedback into positive, neutral, and negative sentiment so you can see how customers feel about their interactions overall." />
        </CardTitle>
        <CardDescription>Customer feedback analysis</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="score"
              nameKey="sentiment"
              innerRadius={60}
              strokeWidth={5}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="sentiment" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
