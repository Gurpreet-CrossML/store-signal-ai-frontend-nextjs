"use client";

import { Label, Pie, PieChart } from "recharts";

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
  const totalScore = data.reduce((total, item) => total + item.score, 0);
  const percentageFor = (sentiment: string) => {
    const score = data.find((item) => item.sentiment === sentiment)?.score ?? 0;
    return totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
  };

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
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                    return null;
                  }

                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                      <tspan
                        x={viewBox.cx}
                        dy="-4"
                        className="fill-foreground text-2xl font-semibold"
                      >
                        {percentageFor("positive")}%
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        dy="22"
                        className="fill-muted-foreground text-xs"
                      >
                        positive
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
            <ChartLegend
              content={
                <ChartLegendContent
                  nameKey="sentiment"
                  formatter={(label) =>
                    `${label} ${percentageFor(String(label).toLowerCase())}%`
                  }
                  className="-translate-y-2 gap-2 whitespace-nowrap"
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
