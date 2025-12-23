import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  StatCard,
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/dashboard";
import {
  IconPlus,
  IconPhoneOutgoing,
  IconPhoneIncoming,
  IconClock,
  IconPhone,
  IconPhoneCall,
  IconPhoneCheck,
  IconPhoneOff,
  IconSearch,
  IconFilter,
  IconDotsVertical,
  IconPlayerPlay,
  IconNote,
  IconCalendar,
  IconTrendingUp,
} from "@tabler/icons-react";

const outcomeConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  INTERESTED: {
    label: "Interested",
    color: "text-green-700",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    color: "text-red-700",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  CALLBACK_REQUESTED: {
    label: "Callback",
    color: "text-blue-700",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  WRONG_NUMBER: {
    label: "Wrong Number",
    color: "text-gray-700",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  NOT_REACHABLE: {
    label: "Not Reachable",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  CALL_BACK_LATER: {
    label: "Call Back",
    color: "text-orange-700",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  CONVERTED: {
    label: "Converted",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  INFORMATION_SHARED: {
    label: "Info Shared",
    color: "text-purple-700",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function CallsPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  const { calls, total } = await api.callLog.getAll({ page: 1, limit: 50 });
  const stats = await api.callLog.getStats({});
  const todayStats = await api.callLog.getTodayStats();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Call Log"
          description="Track and manage your calls"
          action={{
            label: "Log Call",
            icon: IconPlus,
          }}
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Today&apos;s Calls
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {todayStats.totalToday}
                  </p>
                </div>
                <div className="rounded-xl bg-white/20 p-2.5">
                  <IconPhoneCall className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <StatCard
            title="Connected"
            value={todayStats.completedToday}
            subtitle="Successful calls today"
            icon={IconPhoneCheck}
            iconColor="text-green-600"
          />
          <StatCard
            title="Total Calls"
            value={stats.total}
            icon={IconPhone}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Connect Rate"
            value={`${stats.connectRate}%`}
            icon={IconTrendingUp}
            iconColor="text-purple-600"
          />
          <StatCard
            title="Interested"
            value={stats.interested}
            icon={IconPhoneCall}
            iconColor="text-green-600"
          />
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Avg Duration
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatDuration(stats.avgDuration)}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <IconClock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All ({total})</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="outbound">Outbound</TabsTrigger>
                  <TabsTrigger value="inbound">Inbound</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search by lead or phone..."
                    className="w-[280px] pl-9"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <IconFilter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px] font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Lead</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Outcome</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Agent</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="w-[60px] text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-[400px]">
                      <EmptyState
                        icon={IconPhone}
                        title="No calls logged yet"
                        description="Start making calls to see them logged here automatically."
                        action={{ label: "Log Call" }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call) => {
                    const outcome = call.outcome
                      ? outcomeConfig[call.outcome]
                      : null;

                    return (
                      <TableRow
                        key={call.id}
                        className="group hover:bg-muted/50 cursor-pointer"
                      >
                        <TableCell>
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              call.type === "OUTBOUND"
                                ? "bg-blue-100 dark:bg-blue-900/30"
                                : "bg-green-100 dark:bg-green-900/30"
                            }`}
                          >
                            {call.type === "OUTBOUND" ? (
                              <IconPhoneOutgoing className="h-4 w-4 text-blue-600" />
                            ) : (
                              <IconPhoneIncoming className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium">
                              {call.lead.firstName.charAt(0)}
                              {call.lead.lastName?.charAt(0) ?? ""}
                            </div>
                            <div>
                              <span className="font-medium">
                                {call.lead.firstName} {call.lead.lastName}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {call.toNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={call.status} />
                        </TableCell>
                        <TableCell>
                          {outcome ? (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${outcome.bgColor} ${outcome.color}`}
                            >
                              {outcome.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 text-sm">
                            <IconClock className="text-muted-foreground h-3.5 w-3.5" />
                            {formatDuration(call.duration)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {call.user ? (
                            <div className="flex items-center gap-2">
                              <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                                {call.user.name?.charAt(0) ?? "?"}
                              </div>
                              <span className="text-sm">{call.user.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">
                              {formatTime(call.startedAt)}
                            </span>
                            <p className="text-muted-foreground text-xs">
                              {new Date(call.startedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              >
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <IconPlayerPlay className="mr-2 h-4 w-4" />
                                Play Recording
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconNote className="mr-2 h-4 w-4" />
                                View Notes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconCalendar className="mr-2 h-4 w-4" />
                                Schedule Callback
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <IconPhone className="mr-2 h-4 w-4" />
                                Call Again
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
