"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

export const description = "An interactive bar chart";

const chartData = [
  { date: "2024-10-01", physics: 45, chemistry: 38, mathematics: 52 },
  { date: "2024-10-02", physics: 52, chemistry: 41, mathematics: 48 },
  { date: "2024-10-03", physics: 38, chemistry: 45, mathematics: 55 },
  { date: "2024-10-04", physics: 61, chemistry: 52, mathematics: 49 },
  { date: "2024-10-05", physics: 48, chemistry: 59, mathematics: 62 },
  { date: "2024-10-06", physics: 55, chemistry: 48, mathematics: 51 },
  { date: "2024-10-07", physics: 42, chemistry: 55, mathematics: 58 },
  { date: "2024-10-08", physics: 68, chemistry: 62, mathematics: 55 },
  { date: "2024-10-09", physics: 35, chemistry: 42, mathematics: 48 },
  { date: "2024-10-10", physics: 58, chemistry: 51, mathematics: 62 },
  { date: "2024-10-11", physics: 52, chemistry: 58, mathematics: 65 },
  { date: "2024-10-12", physics: 48, chemistry: 52, mathematics: 58 },
  { date: "2024-10-13", physics: 62, chemistry: 68, mathematics: 72 },
  { date: "2024-10-14", physics: 45, chemistry: 48, mathematics: 52 },
  { date: "2024-10-15", physics: 51, chemistry: 55, mathematics: 48 },
  { date: "2024-10-16", physics: 58, chemistry: 62, mathematics: 68 },
  { date: "2024-10-17", physics: 65, chemistry: 58, mathematics: 62 },
  { date: "2024-10-18", physics: 72, chemistry: 68, mathematics: 75 },
  { date: "2024-10-19", physics: 48, chemistry: 52, mathematics: 58 },
  { date: "2024-10-20", physics: 55, chemistry: 48, mathematics: 52 },
  { date: "2024-10-21", physics: 62, chemistry: 58, mathematics: 65 },
];

const chartConfig = {
  views: {
    label: "Test Attempts",
  },
  physics: {
    label: "Physics",
    color: "var(--primary)",
  },
  chemistry: {
    label: "Chemistry",
    color: "hsl(var(--chart-2))",
  },
  mathematics: {
    label: "Mathematics",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function BarGraph() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("physics");

  const total = React.useMemo(
    () => ({
      physics: chartData.reduce((acc, curr) => acc + curr.physics, 0),
      chemistry: chartData.reduce((acc, curr) => acc + curr.chemistry, 0),
      mathematics: chartData.reduce((acc, curr) => acc + curr.mathematics, 0),
    }),
    [],
  );

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    // Removed error mock
  }, [activeChart]);

  if (!isClient) {
    return null;
  }

  return (
    <Card className="@container/card !pt-3">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 !py-0">
          <CardTitle>Test Attempts by Subject</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              Subject-wise test attempts this month
            </span>
            <span className="@[540px]/card:hidden">This month</span>
          </CardDescription>
        </div>
        <div className="flex">
          {["physics", "chemistry", "mathematics"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            if (!chart || total[key as keyof typeof total] === 0) return null;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key as keyof typeof total]?.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient id="fillBar" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--primary)", opacity: 0.1 }}
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill="url(#fillBar)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
