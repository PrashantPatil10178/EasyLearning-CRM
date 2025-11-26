import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconUsers,
  IconPhone,
  IconBriefcase,
  IconChecklist,
  IconTrendingUp,
  IconAlertTriangle,
  IconCalendar,
  IconCurrencyRupee,
} from "@tabler/icons-react";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  const stats = await api.dashboard.getStats();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {session.user.name?.split(" ")[0] ?? "User"}!
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your CRM today.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <IconUsers className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leads.total}</div>
              <p className="text-muted-foreground text-xs">
                +{stats.leads.newThisMonth} this month
              </p>
            </CardContent>
          </Card>

          {/* New Leads Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Today</CardTitle>
              <IconTrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leads.newToday}</div>
              <p className="text-muted-foreground text-xs">Fresh leads to work on</p>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <IconChecklist className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasks.pending}</div>
              {stats.tasks.overdue > 0 && (
                <p className="text-xs text-red-500">
                  <IconAlertTriangle className="mr-1 inline h-3 w-3" />
                  {stats.tasks.overdue} overdue
                </p>
              )}
            </CardContent>
          </Card>

          {/* Calls Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
              <IconPhone className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.calls.today}</div>
              <p className="text-muted-foreground text-xs">Outbound calls made</p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Follow-ups Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Follow-ups Today</CardTitle>
              <IconCalendar className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.leads.followUpsToday}</div>
              <p className="text-muted-foreground text-xs">Scheduled for today</p>
            </CardContent>
          </Card>

          {/* Total Deals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <IconBriefcase className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deals.total}</div>
              <p className="text-muted-foreground text-xs">In pipeline</p>
            </CardContent>
          </Card>

          {/* Pipeline Value */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <IconCurrencyRupee className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(stats.deals.pipelineValue / 100000).toFixed(1)}L
              </div>
              <p className="text-muted-foreground text-xs">Potential revenue</p>
            </CardContent>
          </Card>

          {/* Closed Won This Month */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won This Month</CardTitle>
              <IconCurrencyRupee className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{(stats.deals.closedWonThisMonth / 100000).toFixed(1)}L
              </div>
              <p className="text-muted-foreground text-xs">Revenue closed</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center space-y-0">
              <IconUsers className="mr-3 h-8 w-8 text-blue-500" />
              <div>
                <CardTitle className="text-lg">Add New Lead</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Capture a new prospect
                </p>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center space-y-0">
              <IconPhone className="mr-3 h-8 w-8 text-green-500" />
              <div>
                <CardTitle className="text-lg">Make a Call</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Connect with leads
                </p>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center space-y-0">
              <IconChecklist className="mr-3 h-8 w-8 text-purple-500" />
              <div>
                <CardTitle className="text-lg">View Tasks</CardTitle>
                <p className="text-muted-foreground text-sm">
                  See pending work
                </p>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
