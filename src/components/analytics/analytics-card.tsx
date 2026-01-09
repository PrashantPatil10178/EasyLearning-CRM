"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  type: "leads" | "revenue" | "summary";
  data: any;
}

export function AnalyticsCard({ type, data }: AnalyticsCardProps) {
  if (type === "leads") {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Lead Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Leads */}
          <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50">
            <span className="text-sm font-medium">Total Leads</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.totalLeads}</span>
              {data.periodComparison && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    data.periodComparison.change >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {data.periodComparison.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(data.periodComparison.change)}%
                </span>
              )}
            </div>
          </div>

          {/* Lead Sources */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Top Lead Sources:</p>
            {data.sources?.map((source: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-white/50 p-2 dark:bg-zinc-900/50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      index === 0 && "bg-purple-500",
                      index === 1 && "bg-pink-500",
                      index === 2 && "bg-blue-500",
                      index === 3 && "bg-orange-500",
                    )}
                  />
                  <span className="text-sm font-medium">{source.source}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm">
                    {source.count} leads
                  </span>
                  <span className="min-w-[3rem] text-right text-sm font-semibold">
                    {source.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "revenue") {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            Revenue Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Revenue */}
          <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50">
            <span className="text-sm font-medium">Total Revenue</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                ₹{(data.totalRevenue / 1000000).toFixed(2)}M
              </span>
              {data.revenueGrowth && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    data.revenueGrowth >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {data.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(data.revenueGrowth)}%
                </span>
              )}
            </div>
          </div>

          {/* Conversion Rate */}
          {data.conversionRate && (
            <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-xl font-bold">{data.conversionRate}%</span>
            </div>
          )}

          {/* Top Campaigns */}
          {data.topCampaigns && data.topCampaigns.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Top Campaigns:</p>
              {data.topCampaigns.map((campaign: any, index: number) => (
                <div
                  key={index}
                  className="rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{campaign.name}</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      ₹{(campaign.revenue / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 flex gap-4 text-xs">
                    <span>{campaign.leads} leads</span>
                    <span>{campaign.conversions} conversions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === "summary") {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lead Stats */}
          {data.leads && (
            <div className="rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50">
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold">Leads</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-xl font-bold">{data.leads.total}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Growth</p>
                  <p className="flex items-center gap-1 text-xl font-bold text-green-600 dark:text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    {data.leads.growth}%
                  </p>
                </div>
              </div>
              {data.leads.topSource && (
                <p className="mt-2 text-xs">
                  Top source:{" "}
                  <span className="font-semibold">
                    {data.leads.topSource.source}
                  </span>{" "}
                  ({data.leads.topSource.percentage}%)
                </p>
              )}
            </div>
          )}

          {/* Revenue Stats */}
          {data.revenue && (
            <div className="rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-semibold">Revenue</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-xl font-bold">
                    ₹{(data.revenue.total / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Growth</p>
                  <p className="flex items-center gap-1 text-xl font-bold text-green-600 dark:text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    {data.revenue.growth}%
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs">
                Conversion rate:{" "}
                <span className="font-semibold">
                  {data.revenue.conversionRate}%
                </span>
              </p>
            </div>
          )}

          {/* Top Campaign */}
          {data.topCampaign && (
            <div className="rounded-lg bg-white/50 p-3 dark:bg-zinc-900/50">
              <p className="mb-2 text-xs font-semibold">🏆 Top Campaign</p>
              <p className="font-bold">{data.topCampaign.name}</p>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {data.topCampaign.leads} leads
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ₹{(data.topCampaign.revenue / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
