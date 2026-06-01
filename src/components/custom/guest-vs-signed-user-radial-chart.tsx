"use client"

import {
    Label,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"

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

export const description = "A radial chart with stacked sections"

const chartConfig = {
    guest: {
        label: "Guest",
        color: "var(--chart-1)",
    },
    signed: {
        label: "Signed In",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

export function GuestVsSignedUserRadialChart(
    { chartData }: { chartData: { month: string, guest: number, signed: number }[] }
) {
    const totalVisitors = chartData[0].guest + chartData[0].signed

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Guest vs Signed In Users</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square w-full max-w-[250px]"
                >
                    <RadialBarChart
                        data={chartData}
                        endAngle={180}
                        innerRadius={80}
                        outerRadius={110}
                    >
                        <RadialBar
                            dataKey="guest"
                            fill="var(--color-guest)"
                            stackId="a"
                            cornerRadius={5}
                            className="stroke-transparent stroke-2"
                        />
                        <RadialBar
                            dataKey="signed"
                            stackId="b"
                            cornerRadius={5}
                            fill="var(--color-signed)"
                            className="stroke-transparent stroke-2"
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) - 16}
                                                    className="fill-foreground text-2xl font-bold"
                                                >
                                                    {totalVisitors.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 4}
                                                    className="fill-muted-foreground"
                                                >
                                                    Visitors
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
