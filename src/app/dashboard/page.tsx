import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard, QuickActionCard } from "@/components/dashboard";
import { WorkspaceRedirect } from "@/components/workspace-redirect";
import {
  IconUsers,
  IconPhone,
  IconChecklist,
  IconTrendingUp,
  IconAlertTriangle,
  IconCalendar,
  IconArrowRight,
  IconPlus,
  IconTarget,
  IconClipboardCheck,
  IconPhoneCall,
  IconClock,
  IconChartBar,
} from "@tabler/icons-react";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  // Check for workspaces
  let workspaces;
  try {
    workspaces = await api.workspace.getAll();
  } catch (error) {
    // If workspace access fails, user might not be authenticated properly
    return redirect("/signin");
  }

  if (workspaces.length === 0) {
    return redirect("/no-workspace");
  }

  let stats;
  try {
    stats = await api.dashboard.getStats();
  } catch (error) {
    // If we fail to get stats (likely due to missing workspace context),
    // redirect to the first available workspace.
    return <WorkspaceRedirect workspaceId={workspaces[0]!.id} />;
  }

  // Get current time for greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-blue-100">{greeting}</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                {session.user.name?.split(" ")[0] ?? "User"} 👋
              </h1>
              <p className="mt-2 text-blue-100">
                Here&apos;s what&apos;s happening with your CRM today.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30"
                asChild
              >
                <Link href="/dashboard/leads">
                  <IconUsers className="mr-2 h-4 w-4" />
                  View Leads
                </Link>
              </Button>
              <Button
                className="bg-white text-blue-600 hover:bg-blue-50"
                asChild
              >
                <Link href="/dashboard/leads">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Lead
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Today's Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Leads"
            value={stats.leads.newToday}
            subtitle="New leads captured today"
            icon={IconUsers}
            iconColor="text-blue-600"
            variant="bordered"
          />
          <StatCard
            title="Calls Made Today"
            value={stats.calls.today}
            subtitle="Outbound calls"
            icon={IconPhoneCall}
            iconColor="text-green-600"
            variant="bordered"
          />
          <StatCard
            title="Follow-ups Due"
            value={stats.leads.followUpsToday}
            subtitle="Scheduled for today"
            icon={IconCalendar}
            iconColor="text-orange-600"
            variant="bordered"
          />
          <StatCard
            title="Pending Tasks"
            value={stats.tasks.pending}
            subtitle={
              stats.tasks.overdue > 0
                ? `${stats.tasks.overdue} overdue`
                : "On track"
            }
            icon={IconChecklist}
            iconColor={
              stats.tasks.overdue > 0 ? "text-red-600" : "text-purple-600"
            }
            variant="bordered"
          />
        </div>

        {/* Pipeline & Revenue Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pipeline Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course Inquiries</CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  Track your leads across stages
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/leads">
                  View All
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Leads</span>
                    <Badge variant="secondary">{stats.leads.total}</Badge>
                  </div>
                  <div className="text-3xl font-bold">
                    {stats.leads.newToday}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    New leads today
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Converted This Month
                    </span>
                    <IconTrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.leads.convertedThisMonth}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Students enrolled
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm font-medium">
                      {stats.leads.total > 0
                        ? Math.round(
                            (stats.leads.convertedThisMonth /
                              stats.leads.total) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.leads.total > 0
                        ? Math.round(
                            (stats.leads.convertedThisMonth /
                              stats.leads.total) *
                              100,
                          )
                        : 0
                    }
                    className="h-3"
                  />
                  <p className="text-muted-foreground text-sm">Target: 20%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTarget className="h-5 w-5" />
                Lead Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Leads</span>
                <span className="font-semibold">{stats.leads.total}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm">New</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.leads.newThisMonth}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-sm">Follow-up Required</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.leads.followUpsToday}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">This Month</span>
                  </div>
                  <span className="text-sm font-medium">
                    {stats.leads.newThisMonth}
                  </span>
                </div>
              </div>
              <Button className="mt-4 w-full" variant="outline" asChild>
                <Link href="/dashboard/leads">
                  View All Leads
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="mb-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="Add New Lead"
              description="Capture a new prospect"
              icon={IconUsers}
              href="/dashboard/leads"
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            />
            <QuickActionCard
              title="Make a Call"
              description="Connect with leads"
              icon={IconPhone}
              href="/dashboard/calls"
              iconColor="text-green-600"
              iconBgColor="bg-green-100 dark:bg-green-900/30"
            />
            <QuickActionCard
              title="Create Task"
              description="Add a new task"
              icon={IconClipboardCheck}
              href="/dashboard/tasks"
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
            />
            <QuickActionCard
              title="View Reports"
              description="Analytics & insights"
              icon={IconChartBar}
              href="/dashboard/reports"
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100 dark:bg-orange-900/30"
            />
          </div>
        </div>

        {/* Alerts & Reminders */}
        {(stats.tasks.overdue > 0 || stats.leads.followUpsToday > 0) && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <IconAlertTriangle className="h-5 w-5" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {stats.tasks.overdue > 0 && (
                  <div className="flex items-center gap-3 rounded-lg bg-white p-4 dark:bg-orange-950/50">
                    <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                      <IconClock className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {stats.tasks.overdue} Overdue Tasks
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Tasks past their due date
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      asChild
                    >
                      <Link href="/dashboard/tasks">View</Link>
                    </Button>
                  </div>
                )}
                {stats.leads.followUpsToday > 0 && (
                  <div className="flex items-center gap-3 rounded-lg bg-white p-4 dark:bg-orange-950/50">
                    <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
                      <IconCalendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {stats.leads.followUpsToday} Follow-ups Today
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Scheduled for today
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      asChild
                    >
                      <Link href="/dashboard/leads">View</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
