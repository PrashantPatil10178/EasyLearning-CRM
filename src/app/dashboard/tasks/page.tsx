import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconPlus, IconCalendar, IconAlertTriangle } from "@tabler/icons-react";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default async function TasksPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  const { tasks, total } = await api.task.getAll({ page: 1, limit: 50 });
  const stats = await api.task.getStats();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Manage your tasks and to-dos
            </p>
          </div>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Task
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
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.dueToday}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tasks found. Create your first task to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className={task.status === "COMPLETED" ? "opacity-60" : ""}
                    >
                      <TableCell>
                        <Checkbox checked={task.status === "COMPLETED"} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <span
                            className={`font-medium ${
                              task.status === "COMPLETED" ? "line-through" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <p className="text-muted-foreground text-sm">
                              {task.description.slice(0, 50)}
                              {task.description.length > 50 ? "..." : ""}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.lead ? (
                          <span className="text-sm">
                            {task.lead.firstName} {task.lead.lastName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[task.priority] ?? ""}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[task.status] ?? ""}>
                          {task.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <span
                            className={`flex items-center text-sm ${
                              isOverdue(task.dueDate) && task.status !== "COMPLETED"
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            {isOverdue(task.dueDate) && task.status !== "COMPLETED" && (
                              <IconAlertTriangle className="mr-1 h-3 w-3" />
                            )}
                            <IconCalendar className="mr-1 h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="bg-primary text-primary-foreground mr-2 flex h-6 w-6 items-center justify-center rounded-full text-xs">
                            {task.assignee?.name?.charAt(0) ?? "?"}
                          </div>
                          <span className="text-sm">{task.assignee?.name}</span>
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
