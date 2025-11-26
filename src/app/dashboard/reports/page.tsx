import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconUsers,
  IconPhone,
  IconTarget,
  IconCurrencyRupee,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconClock,
} from "@tabler/icons-react";

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
  const leadsBySource = await api.lead.getBySource();
  const dealsByStage = await api.deal.getByStage();

  // Calculate percentages for lead sources
  const totalLeadsBySource = leadsBySource.reduce((acc, item) => acc + item._count, 0);
  
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Overview of your CRM performance metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <IconUsers className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalLeads}</div>
              <div className="flex items-center pt-1">
                <IconTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">{dashboardStats.newLeadsToday} new today</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <IconTarget className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.activeDeals}</div>
              <p className="text-xs text-muted-foreground pt-1">
                Pipeline value: ₹{dashboardStats.pipelineValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
              <IconPhone className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.callsToday}</div>
              <p className="text-xs text-muted-foreground pt-1">
                {dashboardStats.pendingTasks} pending tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month Revenue</CardTitle>
              <IconCurrencyRupee className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{dashboardStats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {dashboardStats.conversionRate.toFixed(1)}% conversion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lead Sources & Deal Stages */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadsBySource.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No lead data available</p>
                ) : (
                  leadsBySource.map((source) => {
                    const percentage = totalLeadsBySource > 0
                      ? (source._count / totalLeadsBySource) * 100
                      : 0;
                    return (
                      <div key={source.source} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{source.source}</span>
                          <span className="text-sm text-muted-foreground">
                            {source._count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deal Stages */}
          <Card>
            <CardHeader>
              <CardTitle>Deals by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dealsByStage.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No deal data available</p>
                ) : (
                  dealsByStage.map((stage) => (
                    <div key={stage.stage} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mr-3" />
                        <span className="text-sm font-medium">{stage.stage.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{stage._count} deals</Badge>
                        <span className="text-sm font-medium">
                          ₹{stage._sum.amount?.toLocaleString() ?? 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <IconCalendar className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{dashboardStats.followUpsToday}</p>
                <p className="text-sm text-muted-foreground">Follow-ups Today</p>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <IconClock className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold">{dashboardStats.pendingTasks}</p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <IconTrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold">{dashboardStats.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <IconCurrencyRupee className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">₹{dashboardStats.pipelineValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
