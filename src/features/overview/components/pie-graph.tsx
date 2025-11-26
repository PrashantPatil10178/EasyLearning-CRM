"use client";

import * as React from "react";
import { IconTrendingUp } from "@tabler/icons-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const chartData = [
  { difficulty: "easy", attempts: 425, fill: "var(--primary)" },
  { difficulty: "medium", attempts: 680, fill: "var(--primary-light)" },
  { difficulty: "hard", attempts: 320, fill: "var(--primary-lighter)" },
];

const chartConfig = {
  attempts: {
    label: "Attempts",
  },
  easy: {
    label: "Easy",
    color: "hsl(var(--chart-1))",
  },
  medium: {
    label: "Medium",
    color: "hsl(var(--chart-2))",
  },
  hard: {
    label: "Hard",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function PieGraph() {
  const totalAttempts = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.attempts, 0);
  }, []);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Test Attempts by Difficulty</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Distribution of test attempts by difficulty level
          </span>
          <span className="@[540px]/card:hidden">Difficulty breakdown</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px]"
        >
          <PieChart>
            <defs>
              {["easy", "medium", "hard"].map((difficulty, index) => (
                <linearGradient
                  key={difficulty}
                  id={`fill${difficulty}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={1 - index * 0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0.7 - index * 0.2}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData.map((item) => ({
                ...item,
                fill: `url(#fill${item.difficulty})`,
              }))}
              dataKey="attempts"
              nameKey="difficulty"
              innerRadius={60}
              strokeWidth={2}
              stroke="var(--background)"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalAttempts.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Total Attempts
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Medium difficulty most popular with{" "}
          {((chartData[1]?.attempts ?? 0 / totalAttempts) * 100).toFixed(1)}%{" "}
          <IconTrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Students prefer balanced challenge level
        </div>
      </CardFooter>
    </Card>
  );
}
