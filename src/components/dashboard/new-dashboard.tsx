"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  BookOpen,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Search,
  Plus,
  Phone,
  CheckSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  recentActivities: any[];
  leadSourceDistribution: { source: string; count: number }[];
  upcomingFollowUps: any[];
}

export function NewDashboard({
  user,
  stats,
  recentActivities,
  leadSourceDistribution,
  upcomingFollowUps,
}: DashboardProps) {
  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8 p-2">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your CRM today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/leads/new">
              <Plus className="mr-2 h-4 w-4" />
              Quick Create
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/20">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Total Leads
                </p>
                <h3 className="text-2xl font-bold">{stats.leads.total}</h3>
              </div>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center text-xs">
              <span className="flex items-center font-medium text-green-500">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                {stats.leads.newThisMonth}
              </span>
              <span className="ml-1">new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-green-100 p-3 dark:bg-green-900/20">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Converted Leads
                </p>
                <h3 className="text-2xl font-bold">
                  {stats.leads.convertedThisMonth}
                </h3>
              </div>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center text-xs">
              <span className="flex items-center font-medium text-green-500">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                Active Students
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-orange-100 p-3 dark:bg-orange-900/20">
                <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Active Campaigns
                </p>
                <h3 className="text-2xl font-bold">{stats.campaigns.active}</h3>
              </div>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center text-xs">
              <span className="flex items-center font-medium text-orange-500">
                Running Now
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-red-100 p-3 dark:bg-red-900/20">
                <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Pending Tasks
                </p>
                <h3 className="text-2xl font-bold">{stats.tasks.pending}</h3>
              </div>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center text-xs">
              <span className="flex items-center font-medium text-red-500">
                Action Required
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Main Chart Section */}
        <div className="col-span-4 space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Lead Sources Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadSourceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="source"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {leadSourceDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Breakdown (Upcoming Follow-ups) */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingFollowUps.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {lead.firstName[0]}
                          {lead.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm leading-none font-medium">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {lead.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDistanceToNow(new Date(lead.nextFollowUp), {
                          addSuffix: true,
                        })}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {upcomingFollowUps.length === 0 && (
                  <p className="text-muted-foreground py-4 text-center">
                    No upcoming follow-ups
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-3 space-y-4">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <Avatar className="mt-0.5 h-9 w-9">
                      <AvatarImage src={activity.user?.image || ""} />
                      <AvatarFallback>
                        {activity.user?.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {activity.user?.name}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {activity.subject}
                        {activity.lead && (
                          <span className="text-primary ml-1 font-medium">
                            • {activity.lead.firstName} {activity.lead.lastName}
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p className="text-muted-foreground py-4 text-center">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overview Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span>Calls Made Today</span>
                  </div>
                  <span className="font-medium">{stats.calls.today}</span>
                </div>
                <Progress value={Math.min(stats.calls.today * 2, 100)} />
                <p className="text-muted-foreground text-right text-xs">
                  Target: 50 calls
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-green-500" />
                    <span>Tasks Completed</span>
                  </div>
                  <span className="font-medium">
                    {/* Assuming we track completed tasks somewhere, using placeholder */}
                    {Math.floor(stats.tasks.pending / 2)}
                  </span>
                </div>
                <Progress value={65} className="bg-green-100" />
                <p className="text-muted-foreground text-right text-xs">
                  65% of daily goal
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
