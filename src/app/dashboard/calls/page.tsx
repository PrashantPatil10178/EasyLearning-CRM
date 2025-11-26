import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPlus,
  IconPhoneOutgoing,
  IconPhoneIncoming,
  IconClock,
} from "@tabler/icons-react";

const statusColors: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  NO_ANSWER: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  BUSY: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  VOICEMAIL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

const outcomeColors: Record<string, string> = {
  INTERESTED: "bg-green-100 text-green-800",
  NOT_INTERESTED: "bg-red-100 text-red-800",
  CALLBACK_REQUESTED: "bg-blue-100 text-blue-800",
  WRONG_NUMBER: "bg-gray-100 text-gray-800",
  NOT_REACHABLE: "bg-yellow-100 text-yellow-800",
  CALL_BACK_LATER: "bg-orange-100 text-orange-800",
  CONVERTED: "bg-emerald-100 text-emerald-800",
  INFORMATION_SHARED: "bg-purple-100 text-purple-800",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default async function CallsPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  const { calls, total } = await api.call.getAll({ page: 1, limit: 50 });
  const stats = await api.call.getStats({});
  const todayStats = await api.call.getTodayStats();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Call Log</h1>
            <p className="text-muted-foreground">
              Track and manage your calls
            </p>
          </div>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Log Call
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {todayStats.completedToday}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Connect Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.connectRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Interested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.interested}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Calls Table */}
        <Card>
          <CardHeader>
            <CardTitle>Call History ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No calls logged yet. Start making calls to see them here.
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        {call.type === "OUTBOUND" ? (
                          <IconPhoneOutgoing className="h-4 w-4 text-blue-500" />
                        ) : (
                          <IconPhoneIncoming className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {call.lead.firstName} {call.lead.lastName}
                      </TableCell>
                      <TableCell>{call.toNumber}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[call.status] ?? ""}>
                          {call.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.outcome ? (
                          <Badge className={outcomeColors[call.outcome] ?? ""}>
                            {call.outcome.replace(/_/g, " ")}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center text-sm">
                          <IconClock className="mr-1 h-3 w-3" />
                          {formatDuration(call.duration)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="bg-primary text-primary-foreground mr-2 flex h-6 w-6 items-center justify-center rounded-full text-xs">
                            {call.user?.name?.charAt(0) ?? "?"}
                          </div>
                          <span className="text-sm">{call.user?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(call.startedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
