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
  IconPhone,
  IconMail,
  IconCalendar,
} from "@tabler/icons-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  INTERESTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  NOT_INTERESTED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  FOLLOW_UP: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  QUALIFIED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  NEGOTIATION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  CONVERTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

export default async function LeadsPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  const { leads, total } = await api.lead.getAll({ page: 1, limit: 20 });
  const stats = await api.lead.getStats();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Manage and track your sales leads
            </p>
          </div>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.newLeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contacted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.qualified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conv. Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Leads ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Course Interest</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No leads found. Add your first lead to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="hover:underline"
                        >
                          {lead.firstName} {lead.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center text-sm">
                            <IconPhone className="mr-1 h-3 w-3" />
                            {lead.phone}
                          </span>
                          {lead.email && (
                            <span className="flex items-center text-sm text-muted-foreground">
                              <IconMail className="mr-1 h-3 w-3" />
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[lead.status] ?? ""}>
                          {lead.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[lead.priority] ?? ""}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.courseInterested ?? "-"}</TableCell>
                      <TableCell>
                        {lead.owner?.name ?? (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.nextFollowUp ? (
                          <span className="flex items-center text-sm">
                            <IconCalendar className="mr-1 h-3 w-3" />
                            {new Date(lead.nextFollowUp).toLocaleDateString()}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <IconPhone className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <IconMail className="h-4 w-4" />
                          </Button>
                        </div>
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
