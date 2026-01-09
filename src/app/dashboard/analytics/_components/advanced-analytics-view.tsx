"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ChevronDown,
  Search,
  Download,
  Filter,
  BarChart3,
  Table as TableIcon,
  Loader2,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DateRange = "7d" | "28d" | "90d" | "365d" | "custom";
type BreakdownType = "campaigns" | "sources" | "owners" | "statuses";
type MetricType = "leads" | "conversions" | "revenue" | "calls";

// Generate theme-aware colors with opacity variations
const getThemeColors = () => {
  return [
    "var(--primary)",
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
};

export function AdvancedAnalyticsView() {
  const [dateRange, setDateRange] = useState<DateRange>("28d");
  const [breakdown, setBreakdown] = useState<BreakdownType>("campaigns");
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([
    "leads",
    "conversions",
  ]);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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
      default:
        start = startOfDay(subDays(end, 28));
    }

    return { startDate: start, endDate: end };
  }, [dateRange]);

  // Fetch data based on breakdown type
  const { data: comparisonData, isLoading } =
    api.analytics.getComparisonData.useQuery({
      startDate,
      endDate,
      breakdownType: breakdown,
    });

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!comparisonData) return [];
    if (!searchQuery) return comparisonData;

    return comparisonData.filter((item: any) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [comparisonData, searchQuery]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    const itemsToShow =
      selectedItems.length > 0
        ? filteredData.filter((item: any) => selectedItems.includes(item.id))
        : filteredData.slice(0, 5);

    // Transform data for multi-line chart
    const dateMap = new Map<string, any>();

    itemsToShow.forEach((item: any) => {
      item.timeline?.forEach((point: any) => {
        const dateKey = point.date;
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { date: dateKey });
        }
        const dateData = dateMap.get(dateKey);
        dateData[item.name] = point.value;
      });
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [filteredData, selectedItems]);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric],
    );
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      {/* Left Sidebar - Controls */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card w-64 space-y-4 overflow-y-auto *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
        <Card className="@container/card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Compare By</CardTitle>
            <CardDescription>Choose breakdown type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Date Range</Label>
              <Select
                value={dateRange}
                onValueChange={(v: DateRange) => setDateRange(v)}
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
              <p className="text-muted-foreground text-xs">
                {format(startDate, "MMM dd, yyyy")} -{" "}
                {format(endDate, "MMM dd, yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Date Range</CardTitle>
            <CardDescription>Select time period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={breakdown}
              onValueChange={(v: BreakdownType) => setBreakdown(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campaigns">Campaigns</SelectItem>
                <SelectItem value="sources">Lead Sources</SelectItem>
                <SelectItem value="owners">Team Members</SelectItem>
                <SelectItem value="statuses">Status</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Metrics</CardTitle>
            <CardDescription>Select data to display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="leads"
                checked={selectedMetrics.includes("leads")}
                onCheckedChange={() => toggleMetric("leads")}
              />
              <Label
                htmlFor="leads"
                className="cursor-pointer text-sm font-normal"
              >
                Leads
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="conversions"
                checked={selectedMetrics.includes("conversions")}
                onCheckedChange={() => toggleMetric("conversions")}
              />
              <Label
                htmlFor="conversions"
                className="cursor-pointer text-sm font-normal"
              >
                Conversions
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="revenue"
                checked={selectedMetrics.includes("revenue")}
                onCheckedChange={() => toggleMetric("revenue")}
              />
              <Label
                htmlFor="revenue"
                className="cursor-pointer text-sm font-normal"
              >
                Revenue
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="calls"
                checked={selectedMetrics.includes("calls")}
                onCheckedChange={() => toggleMetric("calls")}
              />
              <Label
                htmlFor="calls"
                className="cursor-pointer text-sm font-normal"
              >
                Calls
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Filter</CardTitle>
            <CardDescription>Search items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">
              {breakdown === "campaigns" && "Campaigns"}
              {breakdown === "sources" && "Lead Sources"}
              {breakdown === "owners" && "Team Performance"}
              {breakdown === "statuses" && "Status Breakdown"}
            </h3>
            <p className="text-muted-foreground text-sm">
              Comparing {selectedMetrics.join(", ")} by {breakdown}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("chart")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Chart
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="mr-2 h-4 w-4" />
              Table
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Chart View */}
        {viewMode === "chart" && (
          <Card className="@container/card">
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>
                Performance over time for selected items
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              {isLoading ? (
                <div className="flex h-[400px] items-center justify-center">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        format(new Date(value), "MMM dd")
                      }
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background rounded-lg border p-3 shadow-lg">
                              <p className="mb-2 text-sm font-semibold">
                                {format(
                                  new Date(payload[0]?.payload.date),
                                  "MMM dd, yyyy",
                                )}
                              </p>
                              {payload.map((entry, index) => (
                                <p
                                  key={index}
                                  className="text-sm"
                                  style={{ color: entry.color }}
                                >
                                  {entry.name}:{" "}
                                  <span className="font-semibold">
                                    {entry.value}
                                  </span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {(selectedItems.length > 0
                      ? filteredData.filter((item: any) =>
                          selectedItems.includes(item.id),
                        )
                      : filteredData.slice(0, 5)
                    ).map((item: any, index: number) => {
                      const themeColors = getThemeColors();
                      return (
                        <Line
                          key={item.id}
                          type="monotone"
                          dataKey={item.name}
                          stroke={themeColors[index % themeColors.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Table View */}
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
            <CardDescription>
              Complete metrics for all {breakdown}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      {selectedMetrics.includes("leads") && (
                        <>
                          <TableHead className="text-right">Leads</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </>
                      )}
                      {selectedMetrics.includes("conversions") && (
                        <>
                          <TableHead className="text-right">
                            Conversions
                          </TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                        </>
                      )}
                      {selectedMetrics.includes("revenue") && (
                        <>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </>
                      )}
                      {selectedMetrics.includes("calls") && (
                        <TableHead className="text-right">Calls</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Total Row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>Total</TableCell>
                      {selectedMetrics.includes("leads") && (
                        <>
                          <TableCell className="text-right">
                            {filteredData
                              .reduce(
                                (sum: number, item: any) =>
                                  sum + (item.leads || 0),
                                0,
                              )
                              .toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">100%</TableCell>
                        </>
                      )}
                      {selectedMetrics.includes("conversions") && (
                        <>
                          <TableCell className="text-right">
                            {filteredData
                              .reduce(
                                (sum: number, item: any) =>
                                  sum + (item.conversions || 0),
                                0,
                              )
                              .toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </>
                      )}
                      {selectedMetrics.includes("revenue") && (
                        <>
                          <TableCell className="text-right">
                            ₹
                            {filteredData
                              .reduce(
                                (sum: number, item: any) =>
                                  sum + (item.revenue || 0),
                                0,
                              )
                              .toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">100%</TableCell>
                        </>
                      )}
                      {selectedMetrics.includes("calls") && (
                        <TableCell className="text-right">
                          {filteredData
                            .reduce(
                              (sum: number, item: any) =>
                                sum + (item.calls || 0),
                              0,
                            )
                            .toLocaleString()}
                        </TableCell>
                      )}
                    </TableRow>

                    {/* Data Rows */}
                    {filteredData.map((item: any, index: number) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="bg-primary h-3 w-3 rounded-full"
                              style={{
                                opacity: 1 - index * 0.12,
                              }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        {selectedMetrics.includes("leads") && (
                          <>
                            <TableCell className="text-right">
                              {item.leads?.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-right">
                              {item.leadsPercentage?.toFixed(1)}%
                            </TableCell>
                          </>
                        )}
                        {selectedMetrics.includes("conversions") && (
                          <>
                            <TableCell className="text-right">
                              {item.conversions?.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-right">
                              {item.conversionRate?.toFixed(1)}%
                            </TableCell>
                          </>
                        )}
                        {selectedMetrics.includes("revenue") && (
                          <>
                            <TableCell className="text-right">
                              ₹{item.revenue?.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-right">
                              {item.revenuePercentage?.toFixed(1)}%
                            </TableCell>
                          </>
                        )}
                        {selectedMetrics.includes("calls") && (
                          <TableCell className="text-right">
                            {item.calls?.toLocaleString()}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
