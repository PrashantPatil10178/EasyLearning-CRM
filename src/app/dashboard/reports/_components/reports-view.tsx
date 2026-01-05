"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Phone, Users, Megaphone, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export function ReportsView() {
  const [activeTab, setActiveTab] = useState("leads");

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="flex items-center justify-between">
        <h2
          className="text-3xl font-bold tracking-tight"
          style={{ fontWeight: 700 }}
        >
          Reports & Analytics
        </h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Calls
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <LeadsReport />
        </TabsContent>
        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsReport />
        </TabsContent>
        <TabsContent value="calls" className="space-y-4">
          <CallsReport />
        </TabsContent>
        <TabsContent value="audit" className="space-y-4">
          <AuditLogReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeadsReport() {
  const { data, isLoading } = api.reports.getLeadReport.useQuery({});
  const COLORS = ["#56ADF5", "#49B882", "#E67E22", "#8b5cf6", "#ef4444"];

  const chartConfig = {
    _count: {
      label: "Leads",
    },
  } satisfies ChartConfig;

  if (isLoading) return <LoadingState />;
  if (!data) return <div>No data available</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lurni-card col-span-1">
        <CardHeader>
          <CardTitle style={{ fontWeight: 700 }}>Leads by Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) =>
                    `${entry.status} ${(entry.percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="_count"
                  nameKey="status"
                >
                  {data.byStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lurni-card col-span-1">
        <CardHeader>
          <CardTitle style={{ fontWeight: 700 }}>Leads by Source</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bySource}>
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
                  style={{ fontWeight: 500 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="_count"
                  name="Leads"
                  radius={[100, 100, 100, 100]}
                  background={{ fill: "#F0F4F8", radius: [100, 100, 100, 100] }}
                >
                  {data.bySource.map((entry: any, index: number) => (
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

      <Card className="lurni-card col-span-1">
        <CardHeader>
          <CardTitle style={{ fontWeight: 700 }}>Leads by Owner</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byOwner} layout="vertical">
                <XAxis
                  type="number"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontWeight: 500 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontWeight: 500 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  name="Leads"
                  radius={[0, 100, 100, 0]}
                  background={{ fill: "#F0F4F8", radius: [0, 100, 100, 0] }}
                >
                  {data.byOwner.map((entry: any, index: number) => (
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
    </div>
  );
}

function CampaignsReport() {
  const { data, isLoading } = api.reports.getCampaignReport.useQuery();

  if (isLoading) return <LoadingState />;

  return (
    <Card className="lurni-card">
      <CardHeader>
        <CardTitle style={{ fontWeight: 700 }}>Campaign Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ fontWeight: 600 }}>Name</TableHead>
              <TableHead style={{ fontWeight: 600 }}>Type</TableHead>
              <TableHead style={{ fontWeight: 600 }}>Status</TableHead>
              <TableHead className="text-right" style={{ fontWeight: 600 }}>
                Total Leads
              </TableHead>
              <TableHead className="text-right" style={{ fontWeight: 600 }}>
                Converted
              </TableHead>
              <TableHead className="text-right" style={{ fontWeight: 600 }}>
                Conversion Rate
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell style={{ fontWeight: 600 }}>
                  {campaign.name}
                </TableCell>
                <TableCell style={{ fontWeight: 500 }}>
                  {campaign.type}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" style={{ fontWeight: 500 }}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" style={{ fontWeight: 500 }}>
                  {campaign.totalLeads}
                </TableCell>
                <TableCell className="text-right" style={{ fontWeight: 500 }}>
                  {campaign.convertedLeads}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="lurni-progress-track max-w-[100px] flex-1">
                      <div
                        className="lurni-progress-fill"
                        style={{
                          width: `${campaign.conversionRate}%`,
                          backgroundColor:
                            campaign.conversionRate > 50
                              ? "#49B882"
                              : "#E67E22",
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 600, minWidth: "45px" }}>
                      {campaign.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CallsReport() {
  const { data, isLoading } = api.reports.getCallReport.useQuery({});

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="lurni-card">
          <CardHeader>
            <CardTitle style={{ fontWeight: 700 }}>Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: "rgba(86, 173, 245, 0.1)" }}
              >
                <Phone className="h-6 w-6" style={{ color: "#56ADF5" }} />
              </div>
              <div className="text-2xl font-bold" style={{ fontWeight: 700 }}>
                {data?.summary.totalCalls}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lurni-card">
          <CardHeader>
            <CardTitle style={{ fontWeight: 700 }}>Total Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: "rgba(73, 184, 130, 0.1)" }}
              >
                <Activity className="h-6 w-6" style={{ color: "#49B882" }} />
              </div>
              <div className="text-2xl font-bold" style={{ fontWeight: 700 }}>
                {Math.round((data?.summary.totalDuration || 0) / 60)} mins
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="lurni-card">
        <CardHeader>
          <CardTitle style={{ fontWeight: 700 }}>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ fontWeight: 600 }}>Agent</TableHead>
                <TableHead style={{ fontWeight: 600 }}>Lead</TableHead>
                <TableHead style={{ fontWeight: 600 }}>Duration</TableHead>
                <TableHead style={{ fontWeight: 600 }}>Status</TableHead>
                <TableHead style={{ fontWeight: 600 }}>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell style={{ fontWeight: 600 }}>
                    {call.user.name}
                  </TableCell>
                  <TableCell style={{ fontWeight: 500 }}>
                    {call.lead.firstName} {call.lead.lastName}
                  </TableCell>
                  <TableCell style={{ fontWeight: 500 }}>
                    {call.duration}s
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" style={{ fontWeight: 500 }}>
                      {call.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 500 }}>
                    {format(new Date(call.startedAt), "PP p")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLogReport() {
  const { data, isLoading } = api.reports.getAuditLog.useQuery({});

  if (isLoading) return <LoadingState />;

  return (
    <Card className="lurni-card">
      <CardHeader>
        <CardTitle style={{ fontWeight: 700 }}>System Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ fontWeight: 600 }}>User</TableHead>
              <TableHead style={{ fontWeight: 600 }}>Action</TableHead>
              <TableHead style={{ fontWeight: 600 }}>Details</TableHead>
              <TableHead style={{ fontWeight: 600 }}>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((log) => (
              <TableRow key={log.id}>
                <TableCell style={{ fontWeight: 600 }}>
                  {log.user?.name}
                </TableCell>
                <TableCell style={{ fontWeight: 500 }}>{log.subject}</TableCell>
                <TableCell
                  className="max-w-md truncate"
                  style={{ fontWeight: 500 }}
                >
                  {log.description}
                </TableCell>
                <TableCell style={{ fontWeight: 500 }}>
                  {format(new Date(log.createdAt), "PP p")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  );
}
