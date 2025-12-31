"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Edit,
  Calendar,
  Save,
  PhoneCall,
  Loader2,
  Mail,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  StickyNote,
  ListTodo,
  History,
  Megaphone,
  Building,
  DollarSign,
  Tag,
  Users,
  Star,
  TrendingUp,
  Activity,
  FileText,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { CallCompletionModal } from "@/components/modal/call-completion-modal";
import PageContainer from "@/components/layout/page-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LEAD_STATUS_HIERARCHY,
  statusStyles,
  statusDisplayNames,
} from "@/lib/lead-status";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [note, setNote] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [revenue, setRevenue] = useState("");
  const [feedbackNeeded, setFeedbackNeeded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isCallingCallerDesk, setIsCallingCallerDesk] = useState(false);
  const [showCallCompletionModal, setShowCallCompletionModal] = useState(false);
  const [showAddCampaignDialog, setShowAddCampaignDialog] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const {
    data: lead,
    isLoading,
    refetch,
  } = api.lead.getById.useQuery({ id: leadId });
  const { data: activities = [], refetch: refetchActivities } =
    api.activity.getByLeadId.useQuery({
      leadId,
    }) as { data: Array<any>; refetch: () => void };
  const { data: tasks = [] } = api.task.getByLeadId.useQuery({ leadId });
  const { data: campaignsData } = api.campaign.getAll.useQuery({
    page: 1,
    limit: 100,
  });
  const campaigns = campaignsData?.campaigns || [];

  const addLeadsToCampaignMutation = api.campaign.addLeads.useMutation({
    onSuccess: () => {
      toast.success("Lead added to campaign successfully");
      refetch();
      setShowAddCampaignDialog(false);
      setSelectedCampaignId("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add lead to campaign");
    },
  });

  const updateStatusMutation = api.lead.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const quickSaveMutation = api.lead.quickSave.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update lead");
    },
  });

  const addNoteMutation = api.activity.addNote.useMutation({
    onSuccess: () => {
      toast.success("Note added successfully");
      setNote("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add note");
    },
  });

  const createTaskMutation = api.task.create.useMutation({
    onSuccess: () => {
      toast.success("Follow-up task created");
      setTaskNote("");
      setTaskDueAt("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-primary h-12 w-12 animate-spin" />
            <p className="text-muted-foreground">Loading lead details...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!lead) {
    return (
      <PageContainer>
        <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4">
          <AlertCircle className="text-muted-foreground h-12 w-12" />
          <h2 className="text-xl font-semibold">Lead not found</h2>
          <p className="text-muted-foreground">
            The lead you are looking for does not exist or has been deleted.
          </p>
          <Button asChild variant="secondary">
            <Link href="/dashboard/leads">Back to Leads</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate({ id: leadId, status });
  };

  const handleQuickSave = () => {
    quickSaveMutation.mutate({
      id: leadId,
      revenue: parseFloat(revenue) || 0,
      feedbackNeeded,
    });
  };

  const handleAddNote = () => {
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }
    addNoteMutation.mutate({ leadId, message: note });
  };

  const handleCreateTask = () => {
    if (!taskDueAt) {
      toast.error("Please select a due date");
      return;
    }
    createTaskMutation.mutate({
      leadId,
      note: taskNote,
      dueAt: new Date(taskDueAt),
    });
  };

  const handleAddToCampaign = () => {
    if (!selectedCampaignId) {
      toast.error("Please select a campaign");
      return;
    }
    addLeadsToCampaignMutation.mutate({
      campaignId: selectedCampaignId,
      leadIds: [leadId],
    });
  };

  const getInitials = (first: string, last?: string) => {
    return `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    return (
      statusStyles[status as keyof typeof statusStyles] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <Activity className="h-3 w-3" />;
      case "WON":
        return <CheckCircle2 className="h-3 w-3" />;
      case "LOST":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 pb-10">
        {/* Top Navigation & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit gap-2 pl-0 hover:bg-transparent"
            asChild
          >
            <Link href="/dashboard/leads">
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsCallingCallerDesk(true);
                try {
                  const response = await fetch("/api/callerdesk/call", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      leadId: lead.id,
                      phone: lead.phone,
                    }),
                  });
                  const data = await response.json();
                  if (response.ok) {
                    toast.success(
                      "CallerDesk call initiated! Please wait for the call to connect.",
                    );
                    // Open the call completion modal after a short delay
                    setTimeout(() => {
                      setShowCallCompletionModal(true);
                    }, 2000);
                  } else {
                    toast.error(data.error || "Failed to initiate call");
                  }
                } catch (error) {
                  toast.error("Failed to connect to CallerDesk");
                } finally {
                  setIsCallingCallerDesk(false);
                }
              }}
              disabled={isCallingCallerDesk}
              className="gap-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
            >
              {isCallingCallerDesk ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PhoneCall className="h-4 w-4" />
              )}
              Click to Call
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-4 w-4" />
                Manual Call
              </a>
            </Button>
            <Button variant="default" size="sm" asChild className="gap-2">
              <Link href={`/dashboard/leads/${leadId}/edit`}>
                <Edit className="h-4 w-4" />
                Edit Lead
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Assign to Team
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tags
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Header Card */}
        <Card className="overflow-hidden border-0 py-0 shadow-lg">
          <div className="from-primary/10 to-primary/5 bg-gradient-to-r p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {getInitials(lead.firstName, lead.lastName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-1 -bottom-1 rounded-full bg-white p-1 shadow-md">
                    <div
                      className={`rounded-full p-1 ${getStatusColor(lead.status)}`}
                    >
                      {getStatusIcon(lead.status)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {lead.firstName} {lead.lastName}
                  </h1>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(lead.status)} border`}
                    >
                      {statusDisplayNames[
                        lead.status as keyof typeof statusDisplayNames
                      ] || lead.status}
                    </Badge>
                    <span className="hidden md:inline">•</span>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </div>
                    {lead.email && (
                      <>
                        <span className="hidden md:inline">•</span>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {lead.email}
                        </div>
                      </>
                    )}
                  </div>
                  {(lead.city || lead.state) && (
                    <div className="text-muted-foreground flex items-center gap-1 text-sm">
                      <MapPin className="h-3.5 w-3.5" />
                      {[lead.city, lead.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-sm">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Created {format(new Date(lead.createdAt), "MMM d, yyyy")}
                </div>
                <div className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Owner: {lead.owner?.name || "Unassigned"}
                </div>
                {(lead as any).revenue && (
                  <div className="flex items-center gap-1 font-medium text-green-600">
                    <DollarSign className="h-3.5 w-3.5" />
                    Revenue: ₹{(lead as any).revenue.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                <TabsTrigger value="activity" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2">
                  <ListTodo className="h-4 w-4" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="gap-2">
                  <Megaphone className="h-4 w-4" />
                  Campaigns
                </TabsTrigger>
              </TabsList>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-6 space-y-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <History className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      {activities.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                          <History className="mb-3 h-12 w-12 opacity-20" />
                          <p className="text-lg font-medium">
                            No activities yet
                          </p>
                          <p className="text-sm">
                            Start engaging with this lead to see activity here.
                          </p>
                        </div>
                      ) : (
                        <div className="border-muted relative ml-4 space-y-8 border-l-2 pl-6 sm:ml-2 sm:space-y-6 sm:pl-6">
                          {activities.map((activity) => {
                            // Determine icon and color based on activity type
                            const getActivityStyle = (type: string) => {
                              switch (type) {
                                case "CALL":
                                  return {
                                    color: "bg-green-500",
                                    icon: PhoneCall,
                                    bgColor: "bg-green-50 dark:bg-green-900/20",
                                    borderColor:
                                      "border-green-200 dark:border-green-800",
                                  };
                                case "EMAIL":
                                  return {
                                    color: "bg-blue-500",
                                    icon: Mail,
                                    bgColor: "bg-blue-50 dark:bg-blue-900/20",
                                    borderColor:
                                      "border-blue-200 dark:border-blue-800",
                                  };
                                case "STATUS_CHANGE":
                                  return {
                                    color: "bg-purple-500",
                                    icon: CheckCircle2,
                                    bgColor:
                                      "bg-purple-50 dark:bg-purple-900/20",
                                    borderColor:
                                      "border-purple-200 dark:border-purple-800",
                                  };
                                case "EDIT":
                                  return {
                                    color: "bg-orange-500",
                                    icon: Edit,
                                    bgColor:
                                      "bg-orange-50 dark:bg-orange-900/20",
                                    borderColor:
                                      "border-orange-200 dark:border-orange-800",
                                  };
                                case "NOTE":
                                  return {
                                    color: "bg-yellow-500",
                                    icon: StickyNote,
                                    bgColor:
                                      "bg-yellow-50 dark:bg-yellow-900/20",
                                    borderColor:
                                      "border-yellow-200 dark:border-yellow-800",
                                  };
                                case "FOLLOW_UP_SCHEDULED":
                                  return {
                                    color: "bg-blue-500",
                                    icon: Calendar,
                                    bgColor: "bg-blue-50 dark:bg-blue-900/20",
                                    borderColor:
                                      "border-blue-200 dark:border-blue-800",
                                  };
                                case "TASK_COMPLETED":
                                  return {
                                    color: "bg-green-500",
                                    icon: CheckCircle2,
                                    bgColor: "bg-green-50 dark:bg-green-900/20",
                                    borderColor:
                                      "border-green-200 dark:border-green-800",
                                  };
                                default:
                                  return {
                                    color: "bg-primary",
                                    icon: Clock,
                                    bgColor: "bg-primary/10",
                                    borderColor: "border-primary/20",
                                  };
                              }
                            };

                            const {
                              color,
                              icon: ActivityIcon,
                              bgColor,
                              borderColor,
                            } = getActivityStyle(activity.type);

                            return (
                              <div key={activity.id} className="relative">
                                <span
                                  className={`bg-background ring-muted absolute top-1 -left-[37px] flex h-8 w-8 items-center justify-center rounded-full ring-2 sm:-left-[31px] sm:h-4 sm:w-4`}
                                >
                                  <div
                                    className={`${color} h-4 w-4 rounded-full sm:h-2 sm:w-2`}
                                  />
                                </span>
                                <div
                                  className={`rounded-lg border p-4 ${bgColor} ${borderColor}`}
                                >
                                  <div className="flex flex-col gap-2 sm:gap-1">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-center gap-2">
                                        <ActivityIcon
                                          className={`h-4 w-4 ${color.replace("bg-", "text-")}`}
                                        />
                                        <span className="font-medium capitalize">
                                          {activity.type
                                            .replace(/_/g, " ")
                                            .toLowerCase()}
                                        </span>
                                      </div>
                                      <span className="text-muted-foreground text-sm">
                                        {format(
                                          new Date(activity.createdAt),
                                          "MMM d, h:mm a",
                                        )}
                                      </span>
                                    </div>
                                    {activity.subject && (
                                      <p className="font-medium">
                                        {activity.subject}
                                      </p>
                                    )}
                                    <p className="text-muted-foreground leading-relaxed">
                                      {(activity as any).message ||
                                        activity.description}
                                    </p>
                                    {activity.user && (
                                      <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage
                                            src={activity.user.image || ""}
                                          />
                                          <AvatarFallback className="text-xs">
                                            {getInitials(
                                              activity.user.name || "",
                                            )}
                                          </AvatarFallback>
                                        </Avatar>
                                        {activity.user.name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="mt-6 space-y-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ListTodo className="h-5 w-5" />
                      Schedule Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date & Time</Label>
                        <Input
                          id="dueDate"
                          type="datetime-local"
                          value={taskDueAt}
                          onChange={(e) => setTaskDueAt(e.target.value)}
                          className="focus:ring-primary/20 transition-all focus:ring-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taskNote">Note</Label>
                        <Input
                          id="taskNote"
                          placeholder="e.g. Call regarding pricing"
                          value={taskNote}
                          onChange={(e) => setTaskNote(e.target.value)}
                          className="focus:ring-primary/20 transition-all focus:ring-2"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateTask}
                      disabled={createTaskMutation.isPending}
                      className="w-full transition-all sm:w-auto"
                    >
                      {createTaskMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Calendar className="mr-2 h-4 w-4" />
                      )}
                      Schedule Task
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    <ListTodo className="h-4 w-4" />
                    Upcoming Tasks
                  </h3>
                  {tasks.length === 0 ? (
                    <Card className="bg-muted/40 border-dashed shadow-sm">
                      <CardContent className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                        <CheckCircle2 className="mb-3 h-12 w-12 opacity-20" />
                        <p className="text-lg font-medium">No pending tasks</p>
                        <p className="text-sm">
                          Schedule a follow-up to stay on top of this lead.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    tasks.map((task) => (
                      <Card
                        key={task.id}
                        className="shadow-sm transition-all hover:shadow-md"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="font-medium"
                                >
                                  {task.status}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {(task.dueDate || (task as any).dueAt) &&
                                    format(
                                      new Date(
                                        task.dueDate || (task as any).dueAt,
                                      ),
                                      "PPP p",
                                    )}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {task.description || (task as any).note}
                              </p>
                            </div>
                            {(task as any).assignee && (
                              <Avatar
                                className="h-6 w-6"
                                title={(task as any).assignee.name || ""}
                              >
                                <AvatarImage
                                  src={(task as any).assignee.image || ""}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(
                                    (task as any).assignee.name || "",
                                  )}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-6 space-y-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <StickyNote className="h-5 w-5" />
                      Add Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Write down call summary, key points, or internal notes..."
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="focus:ring-primary/20 resize-none transition-all focus:ring-2"
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={addNoteMutation.isPending}
                      className="transition-all"
                    >
                      {addNoteMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Note
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="mt-6 space-y-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Megaphone className="h-5 w-5" />
                          Active Campaigns
                        </CardTitle>
                        <CardDescription>
                          Campaigns this lead is currently part of.
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowAddCampaignDialog(true)}
                        className="gap-2"
                      >
                        <Megaphone className="h-4 w-4" />
                        Add to Campaign
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lead.campaignLeads && lead.campaignLeads.length > 0 ? (
                      <div className="space-y-4">
                        {lead.campaignLeads.map((cl: any) => (
                          <div
                            key={cl.id}
                            className="flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-md"
                          >
                            <div className="space-y-1">
                              <Link
                                href={`/dashboard/campaigns/${cl.campaignId}`}
                                className="font-medium hover:underline"
                              >
                                {cl.campaign.name}
                              </Link>
                              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Badge
                                  variant="outline"
                                  className="font-medium"
                                >
                                  {cl.campaign.type}
                                </Badge>
                                <span>•</span>
                                <span>
                                  Joined{" "}
                                  {format(
                                    new Date(cl.createdAt),
                                    "MMM d, yyyy",
                                  )}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant={
                                cl.status === "converted"
                                  ? "default"
                                  : cl.status === "contacted"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="font-medium"
                            >
                              {cl.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                        <Megaphone className="mb-3 h-12 w-12 opacity-20" />
                        <p className="text-lg font-medium">No campaigns yet</p>
                        <p className="text-sm">
                          Add this lead to a campaign to start automated
                          outreach.
                        </p>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setShowAddCampaignDialog(true)}
                            className="gap-2"
                          >
                            <Megaphone className="h-4 w-4" />
                            Add to Campaign
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/campaigns">
                              Browse Campaigns
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5" />
                  Lead Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedStatus || lead.status}
                  onValueChange={(value) => {
                    setSelectedStatus(value);
                    handleStatusUpdate(value);
                  }}
                >
                  <SelectTrigger className="focus:ring-primary/20 transition-all focus:ring-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUS_HIERARCHY.map((category) => (
                      <div key={category.value}>
                        <div className="text-muted-foreground px-2 py-1.5 text-sm font-semibold">
                          {category.label}
                        </div>
                        {category.statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                <Separator />

                <div className="space-y-3">
                  <Label className="font-medium">Quick Actions</Label>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">
                        Revenue Potential (₹)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={revenue || (lead as any).revenue || ""}
                        onChange={(e) => setRevenue(e.target.value)}
                        placeholder="0.00"
                        className="focus:ring-primary/20 transition-all focus:ring-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="feedback"
                        checked={feedbackNeeded || (lead as any).feedbackNeeded}
                        onCheckedChange={(checked) =>
                          setFeedbackNeeded(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="feedback"
                        className="cursor-pointer text-sm font-medium"
                      >
                        Feedback Needed
                      </Label>
                    </div>
                    <Button
                      onClick={handleQuickSave}
                      disabled={quickSaveMutation.isPending}
                      className="w-full transition-all"
                      variant="secondary"
                    >
                      {quickSaveMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Update Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Info Card */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5" />
                  Lead Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Source</div>
                  <div className="text-right font-medium">{lead.source}</div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Lead Type</div>
                  <div className="text-right font-medium">
                    {(lead as any).leadType || "—"}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Class</div>
                  <div className="text-right font-medium">
                    {(lead as any).className || "—"}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Medium</div>
                  <div className="text-right font-medium">
                    {(lead as any).medium || "—"}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Batch</div>
                  <div className="text-right font-medium">
                    {(lead as any).batch || "—"}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Campaign</div>
                  <div className="text-right font-medium">
                    {(lead as any).campaign || "—"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.phone}</span>
                    <span className="text-muted-foreground text-xs">
                      Mobile
                    </span>
                  </div>
                </div>
                {lead.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="text-muted-foreground mt-0.5 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.email}</span>
                      <span className="text-muted-foreground text-xs">
                        Email
                      </span>
                    </div>
                  </div>
                )}
                {lead.city && (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {[lead.city, lead.state].filter(Boolean).join(", ")}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Location
                      </span>
                    </div>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-start gap-3">
                    <Building className="text-muted-foreground mt-0.5 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.company}</span>
                      <span className="text-muted-foreground text-xs">
                        Company
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Engagement Score
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= 3
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Last Contact
                  </span>
                  <span className="text-sm font-medium">
                    {activities.length > 0
                      ? format(new Date(activities[0].createdAt), "MMM d, yyyy")
                      : "Never"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Total Activities
                  </span>
                  <span className="text-sm font-medium">
                    {activities.length}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Open Tasks
                  </span>
                  <span className="text-sm font-medium">{tasks.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add to Campaign Dialog */}
      <Dialog
        open={showAddCampaignDialog}
        onOpenChange={setShowAddCampaignDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead to Campaign</DialogTitle>
            <DialogDescription>
              Select a campaign to add {lead?.firstName} {lead?.lastName} to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign</Label>
              <Select
                value={selectedCampaignId}
                onValueChange={setSelectedCampaignId}
              >
                <SelectTrigger id="campaign">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.length === 0 ? (
                    <div className="text-muted-foreground p-4 text-center text-sm">
                      No campaigns available
                    </div>
                  ) : (
                    campaigns
                      .filter(
                        (campaign) =>
                          !lead?.campaignLeads?.some(
                            (cl: any) => cl.campaignId === campaign.id,
                          ),
                      )
                      .map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          <div className="flex items-center gap-2">
                            <span>{campaign.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {campaign.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCampaignDialog(false);
                setSelectedCampaignId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToCampaign}
              disabled={
                !selectedCampaignId || addLeadsToCampaignMutation.isPending
              }
            >
              {addLeadsToCampaignMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Campaign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Completion Modal */}
      {lead && (
        <CallCompletionModal
          open={showCallCompletionModal}
          onClose={() => setShowCallCompletionModal(false)}
          leadId={lead.id}
          leadName={`${lead.firstName} ${lead.lastName || ""}`.trim()}
          leadPhone={lead.phone || ""}
          leadCurrentStatus={lead.status}
          onSave={() => {
            refetch();
            refetchActivities();
          }}
        />
      )}
    </PageContainer>
  );
}
