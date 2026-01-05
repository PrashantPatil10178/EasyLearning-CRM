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
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const COLORS = ["#56ADF5", "#49B882", "#E67E22", "#8b5cf6", "#ef4444"];

  const chartConfig = {
    count: {
      label: "Leads",
    },
  } satisfies ChartConfig;

  // Mock data for Top Engaged Courses
  const topEngagedCourses = [
    { name: "JEE Mains 2024", engagement: 450 },
    { name: "NEET Advanced", engagement: 380 },
    { name: "CA Foundation", engagement: 320 },
    { name: "Board Prep", engagement: 280 },
    { name: "Olympiad", engagement: 210 },
  ];

  // Mock data for Engagement Breakdown Table
  const engagementBreakdown = [
    {
      course: "JEE Mains 2024",
      students: 450,
      completion: 78,
      color: "#49B882",
    },
    {
      course: "NEET Advanced",
      students: 380,
      completion: 65,
      color: "#56ADF5",
    },
    {
      course: "CA Foundation",
      students: 320,
      completion: 82,
      color: "#E67E22",
    },
    { course: "Board Prep", students: 280, completion: 71, color: "#8b5cf6" },
  ];

  // Mock data for Assignment & Quiz Overview
  const assignmentStats = {
    totalAssignments: { value: 85, target: 100, trend: "up", change: 12 },
    quizEngagement: { value: 68, target: 100, trend: "up", change: 8 },
    pendingGrading: { value: 23, target: 100, trend: "down", change: 5 },
  };

  return (
    <div
      className="space-y-8 p-2"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontWeight: 700 }}
          >
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground" style={{ fontWeight: 500 }}>
            Here's what's happening with your CRM today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="lurni-card">
            <Link href="/dashboard/leads/new">
              <Plus className="mr-2 h-4 w-4" />
              Quick Create
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="lurni-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: "rgba(86, 173, 245, 0.1)" }}
              >
                <Users className="h-6 w-6" style={{ color: "#56ADF5" }} />
              </div>
              <div>
                <p
                  className="text-muted-foreground text-sm"
                  style={{ fontWeight: 500 }}
                >
                  Total Leads
                </p>
                <h3 className="text-2xl font-bold" style={{ fontWeight: 700 }}>
                  {stats.leads.total}
                </h3>
              </div>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center text-xs">
              <span
                className="flex items-center"
                style={{ fontWeight: 500, color: "#49B882" }}
              >
                <ArrowUpRight className="mr-1 h-3 w-3" />
                {stats.leads.newThisMonth}
              </span>
              <span className="ml-1">new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lurni-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: "rgba(73, 184, 130, 0.1)" }}
              >
                <Users className="h-6 w-6" style={{ color: "#49B882" }} />
              </div>
              <div>
                <p
                  className="text-muted-foreground text-sm"
                  style={{ fontWeight: 500 }}
                >
                  Converted Leads
                </p>
                <h3 className="text-2xl font-bold" style={{ fontWeight: 700 }}>
                  {stats.leads.convertedThisMonth}
                </h3>
              </div>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center text-xs">
              <span
                className="flex items-center"
                style={{ fontWeight: 500, color: "#49B882" }}
              >
                <ArrowUpRight className="mr-1 h-3 w-3" />
                Active Students
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lurni-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: "rgba(230, 126, 34, 0.1)" }}
              >
                <BookOpen className="h-6 w-6" style={{ color: "#E67E22" }} />
              </div>
              <div>
                <p
                  className="text-muted-foreground text-sm"
                  style={{ fontWeight: 500 }}
                >
                  Active Campaigns
                </p>
                <h3 className="text-2xl font-bold" style={{ fontWeight: 700 }}>
                  {stats.campaigns.active}
                </h3>
              </div>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center text-xs">
              <span
                className="flex items-center"
                style={{ fontWeight: 500, color: "#E67E22" }}
              >
                Running Now
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lurni-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
              >
                <Clock className="h-6 w-6" style={{ color: "#ef4444" }} />
              </div>
              <div>
                <p
                  className="text-muted-foreground text-sm"
                  style={{ fontWeight: 500 }}
                >
                  Pending Tasks
                </p>
                <h3 className="text-2xl font-bold" style={{ fontWeight: 700 }}>
                  {stats.tasks.pending}
                </h3>
              </div>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center text-xs">
              <span
                className="flex items-center"
                style={{ fontWeight: 500, color: "#ef4444" }}
              >
                Action Required
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Main Chart Section */}
        <div className="col-span-4 space-y-4">
          {/* Top Engaged Courses - Capsule Bar Chart */}
          <Card className="lurni-card">
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>
                Top Engaged Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={chartConfig} className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topEngagedCourses} margin={{ top: 20 }}>
                    <defs>
                      {topEngagedCourses.map((_, index) => (
                        <filter
                          key={`glow-${index}`}
                          id={`glow-${index}`}
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feGaussianBlur
                            stdDeviation="3"
                            result="coloredBlur"
                          />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      ))}
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="transparent"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      style={{ fontWeight: 500 }}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                      style={{ fontWeight: 500 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      cursor={false}
                    />
                    <Bar
                      dataKey="engagement"
                      radius={[100, 100, 100, 100]}
                      background={{
                        fill: "#F0F4F8",
                        radius: [100, 100, 100, 100],
                      }}
                      style={{ filter: "url(#glow-0)" }}
                    >
                      {topEngagedCourses.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          style={{ filter: `url(#glow-${index})` }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Engagement Breakdown - Table with Progress Bars */}
          <Card className="lurni-card">
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>
                Engagement Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ fontWeight: 600 }}>Course</TableHead>
                    <TableHead style={{ fontWeight: 600 }}>Students</TableHead>
                    <TableHead style={{ fontWeight: 600 }}>
                      Completion Rate
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engagementBreakdown.map((course, index) => (
                    <TableRow key={index}>
                      <TableCell style={{ fontWeight: 500 }}>
                        {course.course}
                      </TableCell>
                      <TableCell style={{ fontWeight: 500 }}>
                        {course.students}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="lurni-progress-track flex-1">
                            <div
                              className="lurni-progress-fill"
                              style={{
                                width: `${course.completion}%`,
                                backgroundColor: course.color,
                              }}
                            />
                          </div>
                          <span
                            className="text-sm"
                            style={{ fontWeight: 600, minWidth: "40px" }}
                          >
                            {course.completion}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Assignment & Quiz Overview - Soft Progress Indicators */}
          <Card className="lurni-card" style={{ backgroundColor: "#FAFBFC" }}>
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>
                Assignment & Quiz Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Assignments */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "#49B882" }}
                    />
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>
                      Total Assignments
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 700, fontSize: "16px" }}>
                      {assignmentStats.totalAssignments.value}%
                    </span>
                    <TrendingUp
                      className="h-4 w-4"
                      style={{ color: "#49B882" }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#49B882",
                        fontWeight: 600,
                      }}
                    >
                      +{assignmentStats.totalAssignments.change}%
                    </span>
                  </div>
                </div>
                <div className="lurni-progress-track" style={{ height: "8px" }}>
                  <div
                    className="lurni-progress-fill"
                    style={{
                      width: `${assignmentStats.totalAssignments.value}%`,
                      backgroundColor: "#49B882",
                    }}
                  />
                </div>
              </div>

              {/* Quiz Engagement */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "#56ADF5" }}
                    />
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>
                      Quiz Engagement
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 700, fontSize: "16px" }}>
                      {assignmentStats.quizEngagement.value}%
                    </span>
                    <TrendingUp
                      className="h-4 w-4"
                      style={{ color: "#56ADF5" }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#56ADF5",
                        fontWeight: 600,
                      }}
                    >
                      +{assignmentStats.quizEngagement.change}%
                    </span>
                  </div>
                </div>
                <div className="lurni-progress-track" style={{ height: "8px" }}>
                  <div
                    className="lurni-progress-fill"
                    style={{
                      width: `${assignmentStats.quizEngagement.value}%`,
                      backgroundColor: "#56ADF5",
                    }}
                  />
                </div>
              </div>

              {/* Pending Grading */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "#E67E22" }}
                    />
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>
                      Pending Grading
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 700, fontSize: "16px" }}>
                      {assignmentStats.pendingGrading.value}%
                    </span>
                    <TrendingDown
                      className="h-4 w-4"
                      style={{ color: "#49B882" }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#49B882",
                        fontWeight: 600,
                      }}
                    >
                      -{assignmentStats.pendingGrading.change}%
                    </span>
                  </div>
                </div>
                <div className="lurni-progress-track" style={{ height: "8px" }}>
                  <div
                    className="lurni-progress-fill"
                    style={{
                      width: `${assignmentStats.pendingGrading.value}%`,
                      backgroundColor: "#E67E22",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Sources Overview */}
          <Card className="lurni-card">
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>
                Lead Sources Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadSourceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="source"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      style={{ fontWeight: 500 }}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                      style={{ fontWeight: 500 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
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
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Engagement Breakdown (Upcoming Follow-ups) */}
          <Card className="lurni-card">
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>
                Upcoming Follow-ups
              </CardTitle>
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
                        <p
                          className="text-sm leading-none"
                          style={{ fontWeight: 600 }}
                        >
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p
                          className="text-muted-foreground text-sm"
                          style={{ fontWeight: 500 }}
                        >
                          {lead.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style={{ fontWeight: 600 }}>
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
                  <p
                    className="text-muted-foreground py-4 text-center"
                    style={{ fontWeight: 500 }}
                  >
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
          <Card className="lurni-card">
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>Recent Activity</CardTitle>
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
                      <p
                        className="text-sm leading-none"
                        style={{ fontWeight: 600 }}
                      >
                        {activity.user?.name}
                      </p>
                      <p
                        className="text-muted-foreground text-sm"
                        style={{ fontWeight: 500 }}
                      >
                        {activity.subject}
                        {activity.lead && (
                          <span
                            className="text-primary ml-1"
                            style={{ fontWeight: 600 }}
                          >
                            • {activity.lead.firstName} {activity.lead.lastName}
                          </span>
                        )}
                      </p>
                      <p
                        className="text-muted-foreground text-xs"
                        style={{ fontWeight: 500 }}
                      >
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <p
                    className="text-muted-foreground py-4 text-center"
                    style={{ fontWeight: 500 }}
                  >
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overview Stats */}
          <Card className="lurni-card">
            <CardHeader>
              <CardTitle style={{ fontWeight: 700 }}>Daily Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" style={{ color: "#56ADF5" }} />
                    <span style={{ fontWeight: 500 }}>Calls Made Today</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{stats.calls.today}</span>
                </div>
                <div className="lurni-progress-track">
                  <div
                    className="lurni-progress-fill"
                    style={{
                      width: `${Math.min(stats.calls.today * 2, 100)}%`,
                      backgroundColor: "#56ADF5",
                    }}
                  />
                </div>
                <p
                  className="text-muted-foreground text-right text-xs"
                  style={{ fontWeight: 500 }}
                >
                  Target: 50 calls
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckSquare
                      className="h-4 w-4"
                      style={{ color: "#49B882" }}
                    />
                    <span style={{ fontWeight: 500 }}>Tasks Completed</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>
                    {Math.floor(stats.tasks.pending / 2)}
                  </span>
                </div>
                <div className="lurni-progress-track">
                  <div
                    className="lurni-progress-fill"
                    style={{
                      width: "65%",
                      backgroundColor: "#49B882",
                    }}
                  />
                </div>
                <p
                  className="text-muted-foreground text-right text-xs"
                  style={{ fontWeight: 500 }}
                >
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
