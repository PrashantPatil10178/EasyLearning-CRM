import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard, PageHeader } from "@/components/dashboard";
import {
  IconUsers,
  IconPhone,
  IconTarget,
  IconCurrencyRupee,
  IconTrendingUp,
  IconCalendar,
  IconClock,
  IconChartBar,
  IconChartPie,
  IconArrowUpRight,
  IconArrowDownRight,
  IconBriefcase,
  IconDownload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default async function ReportsPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  // Check if user has permission
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    return redirect("/dashboard");
  }

  const dashboardStats = await api.dashboard.getStats();
  const dealsByStage = await api.deal.getByStage();

  // Calculate total pipeline value from deals
  const totalPipelineValue = dealsByStage.reduce(
    (acc: number, stage: { deals: Array<{ amount: number | null }> }) =>
      acc +
      stage.deals.reduce(
        (sum: number, deal: { amount: number | null }) =>
          sum + (deal.amount ?? 0),
        0,
      ),
    0,
  );

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Reports & Analytics"
          description="Overview of your CRM performance metrics"
          action={{
            label: "Export Report",
            icon: IconDownload,
          }}
        />

        {/* Key Metrics - Hero Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Total Leads
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    {dashboardStats.leads.total}
                  </p>
                  <div className="mt-3 flex items-center gap-1">
                    <IconArrowUpRight className="h-4 w-4" />
                    <span className="text-sm">
                      +{dashboardStats.leads.newToday} today
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-white/20 p-3">
                  <IconUsers className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Active Deals
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    {dashboardStats.deals.total}
                  </p>
                  <p className="mt-3 text-sm text-white/80">
                    ₹{(dashboardStats.deals.pipelineValue / 100000).toFixed(1)}L
                    pipeline
                  </p>
                </div>
                <div className="rounded-xl bg-white/20 p-3">
                  <IconBriefcase className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Revenue This Month
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    ₹
                    {(dashboardStats.deals.closedWonThisMonth / 100000).toFixed(
                      1,
                    )}
                    L
                  </p>
                  <div className="mt-3 flex items-center gap-1">
                    <IconArrowUpRight className="h-4 w-4" />
                    <span className="text-sm">+12% vs last month</span>
                  </div>
                </div>
                <div className="rounded-xl bg-white/20 p-3">
                  <IconCurrencyRupee className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Calls Today
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    {dashboardStats.calls.today}
                  </p>
                  <p className="mt-3 text-sm text-white/80">
                    {dashboardStats.tasks.pending} tasks pending
                  </p>
                </div>
                <div className="rounded-xl bg-white/20 p-3">
                  <IconPhone className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different report views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Deal Stages & Quick Stats */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Deal Stages */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <IconChartPie className="h-5 w-5" />
                    Deals by Stage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dealsByStage.length === 0 ? (
                      <p className="text-muted-foreground py-4 text-center">
                        No deal data available
                      </p>
                    ) : (
                      dealsByStage.map(
                        (
                          stage: {
                            stage: string;
                            deals: Array<{ amount: number | null }>;
                          },
                          index: number,
                        ) => {
                          const stageValue = stage.deals.reduce(
                            (sum: number, deal: { amount: number | null }) =>
                              sum + (deal.amount ?? 0),
                            0,
                          );
                          const percentage =
                            totalPipelineValue > 0
                              ? (stageValue / totalPipelineValue) * 100
                              : 0;

                          const colors = [
                            "bg-blue-500",
                            "bg-amber-500",
                            "bg-purple-500",
                            "bg-orange-500",
                            "bg-green-500",
                            "bg-red-500",
                          ];

                          return (
                            <div key={stage.stage} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-3 w-3 rounded-full ${colors[index % colors.length]}`}
                                  />
                                  <span className="text-sm font-medium">
                                    {stage.stage.replace(/_/g, " ")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary">
                                    {stage.deals.length}
                                  </Badge>
                                  <span className="w-20 text-right text-sm font-medium">
                                    ₹{(stageValue / 1000).toFixed(0)}K
                                  </span>
                                </div>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        },
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconChartBar className="h-5 w-5" />
                    Quick Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        New Leads This Month
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {dashboardStats.leads.newThisMonth}
                        </Badge>
                        <IconArrowUpRight className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Follow-ups Today
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      >
                        {dashboardStats.leads.followUpsToday}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overdue Tasks</span>
                      <Badge variant="destructive">
                        {dashboardStats.tasks.overdue}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Pipeline Value
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ₹{(totalPipelineValue / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrendingUp className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border bg-blue-50 p-6 text-center dark:bg-blue-950/30">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <IconCalendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                      {dashboardStats.leads.followUpsToday}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Follow-ups Today
                    </p>
                  </div>

                  <div className="rounded-xl border bg-amber-50 p-6 text-center dark:bg-amber-950/30">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                      <IconClock className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                      {dashboardStats.tasks.pending}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Pending Tasks
                    </p>
                  </div>

                  <div className="rounded-xl border bg-green-50 p-6 text-center dark:bg-green-950/30">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                      <IconTrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                      {dashboardStats.leads.newToday}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      New Leads Today
                    </p>
                  </div>

                  <div className="rounded-xl border bg-purple-50 p-6 text-center dark:bg-purple-950/30">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                      <IconCurrencyRupee className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                      ₹
                      {(dashboardStats.deals.pipelineValue / 100000).toFixed(1)}
                      L
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Pipeline Value
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Total Pipeline"
                value={`₹${(totalPipelineValue / 100000).toFixed(1)}L`}
                subtitle="Active deals value"
                icon={IconTarget}
                variant="bordered"
              />
              <StatCard
                title="Won This Month"
                value={`₹${(dashboardStats.deals.closedWonThisMonth / 100000).toFixed(1)}L`}
                subtitle="Closed revenue"
                icon={IconCurrencyRupee}
                variant="bordered"
              />
              <StatCard
                title="Active Deals"
                value={dashboardStats.deals.total}
                subtitle="In pipeline"
                icon={IconBriefcase}
                variant="bordered"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed sales analytics and charts would be displayed here.
                  This could include revenue trends, deal velocity, and
                  conversion funnels.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Calls Made"
                value={dashboardStats.calls.today}
                subtitle="Today"
                icon={IconPhone}
                variant="bordered"
              />
              <StatCard
                title="Tasks Completed"
                value="0"
                subtitle="This week"
                icon={IconTarget}
                variant="bordered"
              />
              <StatCard
                title="Follow-ups"
                value={dashboardStats.leads.followUpsToday}
                subtitle="Due today"
                icon={IconCalendar}
                variant="bordered"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Team Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Activity timeline and team performance metrics would be
                  displayed here. This could include agent performance, call
                  logs, and task completion rates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
