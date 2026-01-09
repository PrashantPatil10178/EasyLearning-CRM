"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { api } from "@/trpc/react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { AdvancedAnalyticsView } from "./advanced-analytics-view";
import { AIAssistantDialog } from "@/components/analytics/ai-assistant-dialog";
import { useSession } from "next-auth/react";

type DateRange = "7d" | "28d" | "90d" | "365d" | "lifetime" | "custom";

export function AnalyticsView() {
  const [dateRange, setDateRange] = useState<DateRange>("28d");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "leads" | "campaigns" | "revenue" | "trends" | "calls"
  >("overview");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiInitialQuestion, setAiInitialQuestion] = useState("");

  const { data: session } = useSession();

  const openAIAssistant = (question: string) => {
    setAiInitialQuestion(question);
    setAiDialogOpen(true);
  };

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = endOfDay(new Date());
    let start: Date;

    switch (dateRange) {
      case "7d":
        start = startOfDay(subDays(end, 7));
        break;
      case "28d":
        start = startOfDay(subDays(end, 28));
        break;
      case "90d":
        start = startOfDay(subDays(end, 90));
        break;
      case "365d":
        start = startOfDay(subDays(end, 365));
        break;
      case "lifetime":
        start = startOfDay(new Date(2020, 0, 1)); // Arbitrary old date
        break;
      default:
        start = startOfDay(subDays(end, 28));
    }

    return { startDate: start, endDate: end };
  }, [dateRange]);

  // Fetch analytics data
  const { data: timeSeriesData, isLoading: isLoadingTimeSeries } =
    api.analytics.getTimeSeriesData.useQuery({
      startDate,
      endDate,
    });

  const { data: keyMetrics, isLoading: isLoadingMetrics } =
    api.analytics.getKeyMetrics.useQuery({
      startDate,
      endDate,
    });

  const { data: topContent, isLoading: isLoadingTopContent } =
    api.analytics.getTopContent.useQuery({
      startDate,
      endDate,
      limit: 5,
    });

  const isLoading =
    isLoadingTimeSeries || isLoadingMetrics || isLoadingTopContent;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percent: 0, isPositive: true };
    const percent = ((current - previous) / previous) * 100;
    return { percent: Math.abs(percent), isPositive: percent >= 0 };
  };

  // If advanced mode, show advanced view
  if (isAdvancedMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Advanced Analytics
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Compare and analyze data across multiple dimensions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedMode(false)}
          >
            Exit Advanced mode
          </Button>
        </div>
        <AdvancedAnalyticsView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Channel Analytics
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Track your CRM performance and growth metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdvancedMode(true)}
        >
          Advanced mode
        </Button>
      </div>

      {/* Quick Insights */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() =>
            openAIAssistant(
              "How did leads find us? Show me the breakdown of lead sources and which channels are performing best.",
            )
          }
        >
          <Target className="h-4 w-4" />
          How did leads find us?
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() =>
            openAIAssistant(
              "How many new leads did we get? Show me the trend over time and compare it to previous periods.",
            )
          }
        >
          <Users className="h-4 w-4" />
          How many new leads did we get?
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() =>
            openAIAssistant(
              "Summarize my latest CRM performance. Include key metrics, trends, and actionable insights.",
            )
          }
        >
          <TrendingUp className="h-4 w-4" />
          Summarize latest performance
        </Button>
      </div>

      {/* AI Assistant Dialog */}
      <AIAssistantDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        initialQuestion={aiInitialQuestion}
        userName={session?.user?.name || "User"}
      />

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("overview")}
          className={`rounded-none ${activeTab === "overview" ? "border-primary border-b-2" : ""}`}
        >
          Overview
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("leads")}
          className={`rounded-none ${activeTab === "leads" ? "border-primary border-b-2" : ""}`}
        >
          Leads
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("campaigns")}
          className={`rounded-none ${activeTab === "campaigns" ? "border-primary border-b-2" : ""}`}
        >
          Campaigns
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("revenue")}
          className={`rounded-none ${activeTab === "revenue" ? "border-primary border-b-2" : ""}`}
        >
          Revenue
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("calls")}
          className={`rounded-none ${activeTab === "calls" ? "border-primary border-b-2" : ""}`}
        >
          Calls
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("trends")}
          className={`rounded-none ${activeTab === "trends" ? "border-primary border-b-2" : ""}`}
        >
          Trends
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          keyMetrics={keyMetrics}
          timeSeriesData={timeSeriesData}
          topContent={topContent}
          dateRange={dateRange}
          setDateRange={setDateRange}
          isLoadingTimeSeries={isLoadingTimeSeries}
          isLoadingMetrics={isLoadingMetrics}
          isLoadingTopContent={isLoadingTopContent}
        />
      )}

      {activeTab === "leads" && (
        <LeadsTab
          startDate={startDate}
          endDate={endDate}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}

      {activeTab === "campaigns" && (
        <CampaignsTab
          startDate={startDate}
          endDate={endDate}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}

      {activeTab === "revenue" && (
        <RevenueTab
          startDate={startDate}
          endDate={endDate}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}

      {activeTab === "calls" && (
        <CallsTab
          startDate={startDate}
          endDate={endDate}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}

      {activeTab === "trends" && (
        <TrendsTab
          startDate={startDate}
          endDate={endDate}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  keyMetrics,
  timeSeriesData,
  topContent,
  dateRange,
  setDateRange,
  isLoadingTimeSeries,
  isLoadingMetrics,
  isLoadingTopContent,
}: any) {
  return (
    <>
      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Section - Chart and Metrics */}
        <div className="space-y-6 lg:col-span-3">
          {/* Performance Message */}
          {keyMetrics && (
            <Card className="border-primary/20 from-primary/5 via-primary/3 to-background @container/card bg-gradient-to-br">
              <CardContent className="pt-6">
                <h3 className="mb-2 text-xl font-bold">
                  {keyMetrics.growthMessage}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Your CRM generated {keyMetrics.totalLeads.toLocaleString()}{" "}
                  leads, more than the{" "}
                  {keyMetrics.previousLeads.toLocaleString()}–
                  {keyMetrics.expectedLeads.toLocaleString()} it usually gets in{" "}
                  {dateRange === "7d" ? "7" : dateRange === "28d" ? "28" : "90"}{" "}
                  days
                </p>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics Cards */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Leads"
              value={keyMetrics?.totalLeads || 0}
              change={
                keyMetrics
                  ? {
                      percent: keyMetrics.leadsChangePercent,
                      isPositive: (keyMetrics.leadsChange || 0) >= 0,
                    }
                  : undefined
              }
              subtitle={`${keyMetrics?.leadsChangePercent || 0}% more than usual`}
              icon={<Users className="h-4 w-4" />}
              isLoading={isLoadingMetrics}
            />
            <MetricCard
              title="Conversions"
              value={keyMetrics?.totalConversions || 0}
              change={
                keyMetrics
                  ? {
                      percent: keyMetrics.conversionsChangePercent,
                      isPositive: (keyMetrics.conversionsChange || 0) >= 0,
                    }
                  : undefined
              }
              subtitle={`${keyMetrics?.conversionsChangePercent || 0}% conversion rate`}
              icon={<Target className="h-4 w-4" />}
              isLoading={isLoadingMetrics}
            />
            <MetricCard
              title="Active Leads"
              value={keyMetrics?.activeLeads || 0}
              change={
                keyMetrics
                  ? {
                      percent: keyMetrics.activeLeadsChangePercent,
                      isPositive: (keyMetrics.activeLeadsChange || 0) >= 0,
                    }
                  : undefined
              }
              subtitle={`${keyMetrics?.activeLeadsChangePercent || 0}% more than usual`}
              icon={<TrendingUp className="h-4 w-4" />}
              isLoading={isLoadingMetrics}
            />
            <MetricCard
              title="Revenue"
              value={`₹${(keyMetrics?.estimatedRevenue || 0).toLocaleString()}`}
              change={
                keyMetrics
                  ? {
                      percent: keyMetrics.revenueChangePercent,
                      isPositive: (keyMetrics.revenueChange || 0) >= 0,
                    }
                  : undefined
              }
              subtitle={`₹${keyMetrics?.revenueChangeAmount || 0} more than usual`}
              icon={<DollarSign className="h-4 w-4" />}
              isLoading={isLoadingMetrics}
            />
          </div>

          {/* Time Series Chart */}
          <Card className="@container/card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  Performance Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing leads and conversions over time
                </CardDescription>
              </div>
              <Select
                value={dateRange}
                onValueChange={(v) => setDateRange(v as DateRange)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="28d">Last 28 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="365d">Last 365 days</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              {isLoadingTimeSeries ? (
                <div className="flex h-[400px] items-center justify-center">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ChartContainer
                  config={
                    {
                      leads: {
                        label: "Leads",
                        color: "var(--primary)",
                      },
                      conversions: {
                        label: "Conversions",
                        color: "var(--primary)",
                      },
                    } satisfies ChartConfig
                  }
                  className="aspect-auto h-[400px] w-full"
                >
                  <AreaChart
                    data={timeSeriesData || []}
                    margin={{ left: 12, right: 12 }}
                  >
                    <defs>
                      <linearGradient
                        id="fillLeads"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-leads)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-leads)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="fillConversions"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-conversions)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-conversions)"
                          stopOpacity={0.1}
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
                      tickFormatter={(value) =>
                        format(new Date(value), "MMM dd")
                      }
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area
                      dataKey="leads"
                      type="natural"
                      fill="url(#fillLeads)"
                      fillOpacity={1}
                      stroke="var(--color-leads)"
                      strokeWidth={2}
                      stackId="a"
                    />
                    <Area
                      dataKey="conversions"
                      type="natural"
                      fill="url(#fillConversions)"
                      fillOpacity={1}
                      stroke="var(--color-conversions)"
                      strokeWidth={2}
                      stackId="a"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-start gap-2 text-sm">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 leading-none font-medium">
                    {timeSeriesData && timeSeriesData.length > 0 && (
                      <>
                        {format(
                          new Date(timeSeriesData[0].date),
                          "MMM dd, yyyy",
                        )}{" "}
                        -{" "}
                        {timeSeriesData[timeSeriesData.length - 1] &&
                          format(
                            new Date(
                              timeSeriesData[timeSeriesData.length - 1].date,
                            ),
                            "MMM dd, yyyy",
                          )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* See more button */}
          <Button variant="outline" className="w-full">
            See more
          </Button>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Realtime Stats */}
          <Card className="border-primary/20 @container/card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
                Realtime
              </CardTitle>
              <CardDescription className="text-xs">
                Updating live
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-3xl font-bold">
                  {keyMetrics?.activeLeadsNow.toLocaleString() || 0}
                </p>
                <p className="text-muted-foreground text-xs">Active Leads</p>
              </div>
            </CardContent>
          </Card>

          {/* Current Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-muted-foreground text-xs">Views</p>
                  <p className="text-xs font-medium">Last 48h</p>
                </div>
                <p className="text-2xl font-bold">
                  {keyMetrics?.views48h.toLocaleString() || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Top Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Campaigns</CardTitle>
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>Campaign</span>
                <span>Leads</span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTopContent ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {topContent?.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {item.leads.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" size="sm">
            See more
          </Button>
        </div>
      </div>
    </>
  );
}

// Leads Tab Component
function LeadsTab({ startDate, endDate, dateRange, setDateRange }: any) {
  const { data: leadsByStatus } = api.analytics.getLeadSourceBreakdown.useQuery(
    {
      startDate,
      endDate,
    },
  );

  const { data: timeSeriesData } = api.analytics.getTimeSeriesData.useQuery({
    startDate,
    endDate,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="space-y-6 lg:col-span-3">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Lead Generation Trend</CardTitle>
            <CardDescription>
              Daily lead generation over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={
                {
                  leads: {
                    label: "Leads",
                    color: "var(--primary)",
                  },
                } satisfies ChartConfig
              }
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart
                data={timeSeriesData || []}
                margin={{ left: 12, right: 12 }}
              >
                <defs>
                  <linearGradient id="fillLeadsTab" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-leads)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-leads)"
                      stopOpacity={0.1}
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
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  type="natural"
                  dataKey="leads"
                  stroke="var(--color-leads)"
                  fill="url(#fillLeadsTab)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="text-muted-foreground flex items-center gap-2 leading-none font-medium">
                  Showing lead generation trends
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>
              Distribution of leads by source channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadsByStatus?.map((source: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{source.source}</p>
                    <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${source.percentage}%`,
                          opacity: 1 - index * 0.12,
                        }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-bold">{source.count}</p>
                    <p className="text-muted-foreground text-xs">
                      {source.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-sm">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={dateRange}
              onValueChange={(v: any) => setDateRange(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="28d">Last 28 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="365d">Last 365 days</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Campaigns Tab Component
function CampaignsTab({ startDate, endDate, dateRange, setDateRange }: any) {
  const { data: campaigns } = api.analytics.getTopContent.useQuery({
    startDate,
    endDate,
    limit: 10,
  });

  const totalLeads = React.useMemo(() => {
    return (
      campaigns?.reduce((acc: number, curr: any) => acc + curr.leads, 0) || 0
    );
  }, [campaigns]);

  const chartData = React.useMemo(() => {
    return (
      campaigns?.map((campaign: any, index: number) => ({
        name: campaign.name,
        leads: campaign.leads,
        fill: `var(--chart-${(index % 5) + 1})`,
      })) || []
    );
  }, [campaigns]);

  const chartConfig = {
    leads: {
      label: "Leads",
    },
  } satisfies ChartConfig;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Campaign Distribution</CardTitle>
          <CardDescription>
            Lead distribution across all campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[350px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="leads"
                nameKey="name"
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
                            {totalLeads.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            Total Leads
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
          <div className="text-muted-foreground flex items-center gap-2 leading-none font-medium">
            {campaigns && campaigns.length > 0 && campaigns[0] && (
              <>
                Top campaign: {campaigns[0].name} (
                {((campaigns[0].leads / totalLeads) * 100).toFixed(1)}%)
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Ranked by total leads generated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns?.map((campaign: any, index: number) => (
              <div
                key={index}
                className="border-border/50 hover:bg-accent/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                <div
                  className="text-primary-foreground bg-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    opacity: 1 - index * 0.12,
                  }}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{campaign.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {((campaign.leads / totalLeads) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{campaign.leads}</p>
                  <p className="text-muted-foreground text-xs">leads</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Revenue Tab Component
function RevenueTab({ startDate, endDate, dateRange, setDateRange }: any) {
  const { data: keyMetrics } = api.analytics.getKeyMetrics.useQuery({
    startDate,
    endDate,
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 @container/card">
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <CardDescription className="text-xs">
              Revenue generated in period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ₹{keyMetrics?.estimatedRevenue.toLocaleString() || 0}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">Current period</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 from-primary/5 to-background @container/card bg-gradient-to-br">
          <CardHeader>
            <CardTitle className="text-sm">Revenue Change</CardTitle>
            <CardDescription className="text-xs">
              Compared to previous period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-primary text-3xl font-bold">
              +₹{keyMetrics?.revenueChangeAmount.toLocaleString() || 0}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              vs previous period
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 @container/card">
          <CardHeader>
            <CardTitle className="text-sm">Growth Rate</CardTitle>
            <CardDescription className="text-xs">
              Period over period growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {keyMetrics?.revenueChangePercent.toFixed(1) || 0}%
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Period over period
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Trends Tab Component
function TrendsTab({ startDate, endDate, dateRange, setDateRange }: any) {
  const { data: timeSeriesData } = api.analytics.getTimeSeriesData.useQuery({
    startDate,
    endDate,
  });

  return (
    <div className="grid gap-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Conversion Trends</CardTitle>
          <CardDescription>
            Leads and conversions over time with trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={
              {
                leads: {
                  label: "Leads",
                  color: "var(--primary)",
                },
                conversions: {
                  label: "Conversions",
                  color: "var(--primary)",
                },
              } satisfies ChartConfig
            }
            className="aspect-auto h-[400px] w-full"
          >
            <LineChart
              data={timeSeriesData || []}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => format(new Date(value), "MMM dd")}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="var(--color-leads)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="var(--color-conversions)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="text-muted-foreground flex items-center gap-2 leading-none font-medium">
                Showing trend analysis for selected period
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Calls Tab Component
function CallsTab({
  startDate,
  endDate,
  dateRange,
  setDateRange,
}: {
  startDate: Date;
  endDate: Date;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}) {
  // Fetch real agent call analytics data
  const { data: callAnalytics, isLoading } =
    api.analytics.getAgentCallAnalytics.useQuery({
      startDate,
      endDate,
    });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!callAnalytics) {
    return (
      <div className="text-muted-foreground flex h-96 items-center justify-center">
        No call data available
      </div>
    );
  }

  const { overall, timeline, campaignStats, topAgents } = callAnalytics;

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Agent Call Analytics</h3>
        <Select
          value={dateRange}
          onValueChange={(value: DateRange) => setDateRange(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="28d">Last 28 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
            <SelectItem value="lifetime">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-primary/20 @container/card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Total Agents
              </p>
              <Users className="text-primary h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{overall.totalAgents}</p>
              <p className="text-muted-foreground text-xs">
                {overall.activeAgents} active agents
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 @container/card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Total Calls Made
              </p>
              <Target className="text-primary h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {overall.totalCalls.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-xs">
                By all agents in period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 @container/card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Avg Calls/Agent
              </p>
              <TrendingUp className="text-primary h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{overall.avgCallsPerAgent}</p>
              <p className="text-muted-foreground text-xs">
                Per agent in period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 from-primary/5 to-background @container/card bg-gradient-to-br">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Answer Rate
              </p>
              <ArrowUpRight className="text-primary h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-primary text-2xl font-bold">
                {overall.answerRate}%
              </p>
              <p className="text-muted-foreground text-xs">
                {overall.answeredCalls.toLocaleString()} answered
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 @container/card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Top Performer
              </p>
              <TrendingUp className="text-primary h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-lg font-bold">{overall.topPerformer}</p>
              <p className="text-muted-foreground text-xs">
                Highest call volume
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Active Agents vs Total Calls Timeline</CardTitle>
          <CardDescription>
            Daily comparison of active agents and total calls made
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={
              {
                activeAgents: {
                  label: "Active Agents",
                  color: "var(--primary)",
                },
                totalCalls: {
                  label: "Total Calls",
                  color: "var(--primary)",
                },
              } satisfies ChartConfig
            }
            className="aspect-auto h-[300px] w-full"
          >
            <LineChart data={timeline} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="activeAgents"
                stroke="var(--color-activeAgents)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="totalCalls"
                stroke="var(--color-totalCalls)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Calls/Agent Ratio Timeline */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Average Calls per Agent</CardTitle>
          <CardDescription>
            Daily average of calls distributed per agent
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={
              {
                avgCallsPerAgent: {
                  label: "Avg Calls/Agent",
                  color: "var(--primary)",
                },
              } satisfies ChartConfig
            }
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={timeline} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id="fillAvgCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-avgCallsPerAgent)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-avgCallsPerAgent)"
                    stopOpacity={0.1}
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
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                type="natural"
                dataKey="avgCallsPerAgent"
                stroke="var(--color-avgCallsPerAgent)"
                fill="url(#fillAvgCalls)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Campaign-wise Statistics */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Campaign-wise Agent Performance</CardTitle>
          <CardDescription>
            Agent distribution and performance across campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              {campaignStats.map((campaign, index) => (
                <div
                  key={campaign.name}
                  className="border-border/50 hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {campaign.agents} agents
                      </span>
                      <span>•</span>
                      <span>{campaign.totalCalls} calls</span>
                      <span>•</span>
                      <span>{campaign.callsPerAgent} calls/agent</span>
                      <span>•</span>
                      <span>{campaign.answered} answered</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-primary text-lg font-bold">
                      {campaign.conversion}%
                    </p>
                    <p className="text-muted-foreground text-xs">Conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Agents */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Top Performing Agents</CardTitle>
          <CardDescription>
            Ranked by total calls and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topAgents.map((agent, index) => (
              <div
                key={agent.name}
                className="border-border/50 hover:bg-accent/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                <div
                  className="text-primary-foreground bg-primary flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    opacity: 1 - index * 0.15,
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{agent.name}</h4>
                  <div className="text-muted-foreground mt-1 flex gap-4 text-sm">
                    <span>{agent.calls} calls</span>
                    <span>•</span>
                    <span>{agent.answered} answered</span>
                    <span>•</span>
                    <span>{agent.conversions} conversions</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-primary text-lg font-bold">
                    {agent.answerRate}%
                  </p>
                  <p className="text-muted-foreground text-xs">Answer Rate</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  change,
  subtitle,
  icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  change?: { percent: number; isPositive: boolean };
  subtitle: string;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="bg-muted h-8 w-20 animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {change && (
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold ${
                  change.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {change.isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {change.percent.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
