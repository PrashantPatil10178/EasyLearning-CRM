"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  IconCalendar,
  IconAlertTriangle,
  IconSearch,
  IconFilter,
  IconClock,
  IconChecklist,
  IconProgress,
  IconCircleCheck,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { TaskDialog } from "./task-dialog";

const priorityConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  LOW: {
    label: "Low",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  HIGH: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  URGENT: {
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const due = new Date(dueDate);

  if (due.toDateString() === today.toDateString()) return "Today";
  if (due.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return due.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface TaskViewProps {
  initialTasks: any[];
  initialStats: any;
  total: number;
}

export function TaskView({ initialTasks, initialStats, total }: TaskViewProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // We can use the initial data, but for real-time updates after mutations,
  // we might want to rely on the query cache or re-fetch.
  // For simplicity, we'll rely on router.refresh() and invalidation.

  const deleteMutation = api.task.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
      router.refresh();
      utils.task.getAll.invalidate();
      utils.task.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const completeMutation = api.task.complete.useMutation({
    onSuccess: () => {
      toast.success("Task marked as completed");
      router.refresh();
      utils.task.getAll.invalidate();
      utils.task.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleComplete = (id: string) => {
    completeMutation.mutate({ id });
  };

  const handleCreate = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const filteredTasks = initialTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "pending") return task.status === "PENDING";
    if (activeTab === "inprogress") return task.status === "IN_PROGRESS";
    if (activeTab === "overdue")
      return isOverdue(task.dueDate) && task.status !== "COMPLETED";

    return true;
  });

  return (
    <div className="space-y-6">
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
      />

      {/* Header */}
      <PageHeader
        title="Tasks"
        description="Manage your tasks and to-dos"
        action={{
          label: "Add Task",
          icon: IconPlus,
          onClick: handleCreate,
        }}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title="Total Tasks"
          value={initialStats.total}
          icon={IconChecklist}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending"
          value={initialStats.pending}
          icon={IconClock}
          iconColor="text-yellow-600"
        />
        <StatCard
          title="In Progress"
          value={initialStats.inProgress}
          icon={IconProgress}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Completed"
          value={initialStats.completed}
          icon={IconCircleCheck}
          iconColor="text-green-600"
        />
        <Card
          className={`${initialStats.overdue > 0 ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Overdue
              </p>
              {initialStats.overdue > 0 && (
                <IconAlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p
              className={`mt-1 text-2xl font-bold ${initialStats.overdue > 0 ? "text-red-600" : ""}`}
            >
              {initialStats.overdue}
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm font-medium">
              Due Today
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-600">
              {initialStats.dueToday}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({total})</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="inprogress">In Progress</TabsTrigger>
                <TabsTrigger value="overdue">
                  Overdue ({initialStats.overdue})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search tasks..."
                  className="w-[250px] pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold">Task</TableHead>
                <TableHead className="font-semibold">Lead</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold">Assignee</TableHead>
                <TableHead className="w-[80px] text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-[400px]">
                    <EmptyState
                      icon={IconChecklist}
                      title="No tasks found"
                      description="Create your first task to start organizing your work."
                      action={{ label: "Add Task", onClick: handleCreate }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const overdue =
                    isOverdue(task.dueDate) && task.status !== "COMPLETED";
                  const priority = priorityConfig[task.priority] ?? {
                    label: task.priority,
                    color: "text-gray-600",
                    bgColor: "bg-gray-100",
                  };

                  return (
                    <TableRow
                      key={task.id}
                      className={`group hover:bg-muted/50 cursor-pointer ${
                        task.status === "COMPLETED" ? "opacity-60" : ""
                      } ${overdue ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={task.status === "COMPLETED"}
                          onCheckedChange={() => handleComplete(task.id)}
                          className="data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600"
                        />
                      </TableCell>
                      <TableCell onClick={() => handleEdit(task)}>
                        <div className="max-w-[300px]">
                          <span
                            className={`font-medium ${
                              task.status === "COMPLETED"
                                ? "text-muted-foreground line-through"
                                : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <p className="text-muted-foreground mt-0.5 truncate text-sm">
                              {task.description.slice(0, 60)}
                              {task.description.length > 60 ? "..." : ""}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.lead ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium">
                              {task.lead.firstName.charAt(0)}
                            </div>
                            <span className="text-sm">
                              {task.lead.firstName} {task.lead.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${priority.bgColor} ${priority.color}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              task.priority === "URGENT"
                                ? "bg-red-500"
                                : task.priority === "HIGH"
                                  ? "bg-orange-500"
                                  : task.priority === "MEDIUM"
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                            }`}
                          />
                          {priority.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <span
                            className={`inline-flex items-center gap-1.5 text-sm ${
                              overdue
                                ? "font-medium text-red-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {overdue && (
                              <IconAlertTriangle className="h-3.5 w-3.5" />
                            )}
                            <IconCalendar className="h-3.5 w-3.5" />
                            {formatDueDate(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No due date
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                              {task.assignee.name?.charAt(0) ?? "?"}
                            </div>
                            <span className="text-sm">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Unassigned
                          </span>
                        )}
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
                            <DropdownMenuItem
                              onClick={() => handleComplete(task.id)}
                            >
                              <IconCircleCheck className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(task)}>
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(task.id)}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
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
  );
}
