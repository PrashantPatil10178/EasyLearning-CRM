"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Download,
  DollarSign,
  Users,
  CreditCard,
  Activity,
  UserPlus,
} from "lucide-react";
import { AddWidgetSidebar } from "./add-widget-sidebar";
import { WIDGET_CATALOG, type WidgetDefinition } from "@/types/widget-catalog";
import { BarGraph } from "./overview/bar-graph";
import { AreaGraph } from "./overview/area-graph";
import { PieGraph } from "./overview/pie-graph";
import { RecentSales } from "./overview/recent-sales";

interface DashboardProps {
  user: {
    name: string | null;
    image: string | null;
  };
  stats: {
    leads: {
      total: number;
      newToday: number;
      newThisMonth: number;
      convertedThisMonth: number;
    };
    campaigns: {
      active: number;
    };
    tasks: {
      pending: number;
    };
    calls: {
      today: number;
    };
  };
  revenueStats:
    | {
        totalRevenue: number;
        change: number;
        changePercent: number;
        chartData: any[];
        byCampaign: any[];
      }
    | undefined;
  recentActivities: any[];
  leadSourceDistribution: { source: string; count: number }[];
  upcomingFollowUps: any[];
}

export function NewDashboard({
  user,
  stats,
  revenueStats,
  recentActivities,
  leadSourceDistribution,
  upcomingFollowUps,
}: DashboardProps) {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>([]);

  // Load active widgets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-widgets");
    if (saved) {
      try {
        setActiveWidgets(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load widgets:", error);
      }
    }
  }, []);

  // Save active widgets to localStorage
  useEffect(() => {
    if (activeWidgets.length > 0) {
      localStorage.setItem("dashboard-widgets", JSON.stringify(activeWidgets));
    }
  }, [activeWidgets]);

  const handleAddWidget = (widget: WidgetDefinition) => {
    if (!activeWidgets.includes(widget.id)) {
      setActiveWidgets([...activeWidgets, widget.id]);
    }
    setShowAddWidget(false);
  };

  return (
    <div className="flex flex-1 flex-col space-y-2">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Hi, Welcome back 👋
        </h2>
        <div className="hidden items-center space-x-2 md:flex">
          <Button variant="outline" onClick={() => setShowAddWidget(true)}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Add Widget
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <AddWidgetSidebar
        open={showAddWidget}
        onOpenChange={setShowAddWidget}
        onAddWidget={handleAddWidget}
        activeWidgets={activeWidgets}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics - Small Cards with Blue Theme */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{revenueStats?.totalRevenue?.toLocaleString() || "0"}
                </div>
                <p className="text-muted-foreground mt-1 flex items-center text-xs">
                  {revenueStats?.changePercent &&
                  revenueStats.changePercent >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={
                      revenueStats?.changePercent &&
                      revenueStats.changePercent >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {Math.abs(revenueStats?.changePercent || 0).toFixed(1)}%
                  </span>
                  <span className="ml-1">from last month</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                <UserPlus className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  +{stats.leads.newThisMonth.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-1 flex items-center text-xs">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+10.1%</span>
                  <span className="ml-1">from last month</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Leads
                </CardTitle>
                <Users className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.leads.total.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-1 flex items-center text-xs">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+12.5%</span>
                  <span className="ml-1">from last month</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Tasks
                </CardTitle>
                <Activity className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.tasks.pending.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-1 flex items-center text-xs">
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500">-2</span>
                  <span className="ml-1">since last hour</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Widgets Section */}
          {activeWidgets.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {activeWidgets.map((widgetId) => {
                const widget = WIDGET_CATALOG.find((w) => w.id === widgetId);
                if (!widget) return null;
                return (
                  <Card key={widgetId} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {widget.name}
                      </CardTitle>
                      <span className="text-xl">{widget.icon}</span>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="text-muted-foreground mb-4 text-xs">
                        {widget.description}
                      </div>
                      <div className="bg-muted/50 text-muted-foreground flex h-24 w-full items-center justify-center rounded-md border border-dashed p-4 text-center text-xs">
                        {widget.component} Placeholder
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <BarGraph />
            </div>
            <div className="col-span-4 md:col-span-3">
              <RecentSales />
            </div>
            <div className="col-span-4">
              <AreaGraph />
            </div>
            <div className="col-span-4 md:col-span-3">
              <PieGraph />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
