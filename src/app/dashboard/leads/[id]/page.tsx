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
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import PageContainer from "@/components/layout/page-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const {
    data: lead,
    isLoading,
    refetch,
  } = api.lead.getById.useQuery({ id: leadId });
  const { data: activities = [] } = api.activity.getByLeadId.useQuery({
    leadId,
  }) as { data: Array<any> };
  const { data: tasks = [] } = api.task.getByLeadId.useQuery({ leadId });

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
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
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

  const getInitials = (first: string, last?: string) => {
    return `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "WON":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "LOST":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
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
            className="w-fit gap-2 pl-0"
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
                    toast.success("CallerDesk call initiated!");
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
              className="gap-2"
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
          </div>
        </div>

        {/* Header Card */}
        <Card className="bg-primary/5 overflow-hidden border-none shadow-md">
          <div className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {getInitials(lead.firstName, lead.lastName || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {lead.firstName} {lead.lastName}
                  </h1>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                    <Badge
                      variant="secondary"
                      className={getStatusColor(lead.status)}
                    >
                      {lead.status}
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
                </div>
              </div>
              <div className="text-muted-foreground flex flex-col gap-2 text-right text-sm md:items-end">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Created {format(new Date(lead.createdAt), "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Owner: {lead.owner?.name || "Unassigned"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              </TabsList>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <History className="h-4 w-4" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      {activities.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                          <History className="mb-2 h-8 w-8 opacity-20" />
                          <p>No activities recorded yet.</p>
                        </div>
                      ) : (
                        <div className="border-muted relative ml-2 space-y-6 border-l pl-6">
                          {activities.map((activity) => (
                            <div key={activity.id} className="relative">
                              <span className="bg-background ring-muted absolute top-1 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full ring-2">
                                <div className="bg-primary h-2 w-2 rounded-full" />
                              </span>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    {activity.type.replace("_", " ")}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {format(
                                      new Date(activity.createdAt),
                                      "MMM d, h:mm a",
                                    )}
                                  </span>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                  {(activity as any).message ||
                                    activity.description}
                                </p>
                                {activity.user && (
                                  <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage
                                        src={activity.user.image || ""}
                                      />
                                      <AvatarFallback className="text-[8px]">
                                        {getInitials(activity.user.name || "")}
                                      </AvatarFallback>
                                    </Avatar>
                                    {activity.user.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ListTodo className="h-4 w-4" />
                      Schedule Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Due Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={taskDueAt}
                          onChange={(e) => setTaskDueAt(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Note</Label>
                        <Input
                          placeholder="e.g. Call regarding pricing"
                          value={taskNote}
                          onChange={(e) => setTaskNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateTask}
                      disabled={createTaskMutation.isPending}
                      className="w-full sm:w-auto"
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
                  <h3 className="text-muted-foreground text-sm font-medium">
                    Upcoming Tasks
                  </h3>
                  {tasks.length === 0 ? (
                    <Card className="bg-muted/40 border-dashed">
                      <CardContent className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 className="mb-2 h-8 w-8 opacity-20" />
                        <p>No pending tasks.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    tasks.map((task) => (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{task.status}</Badge>
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
                            {task.assignee && (
                              <Avatar
                                className="h-6 w-6"
                                title={task.assignee.name || ""}
                              >
                                <AvatarImage src={task.assignee.image || ""} />
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(task.assignee.name || "")}
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
              <TabsContent value="notes" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <StickyNote className="h-4 w-4" />
                      Add Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Write down call summary, key points, or internal notes..."
                      rows={4}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="resize-none"
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={addNoteMutation.isPending}
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
              <TabsContent value="campaigns" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Megaphone className="h-4 w-4" />
                      Active Campaigns
                    </CardTitle>
                    <CardDescription>
                      Campaigns this lead is currently part of.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lead.campaignLeads && lead.campaignLeads.length > 0 ? (
                      <div className="space-y-4">
                        {lead.campaignLeads.map((cl: any) => (
                          <div
                            key={cl.id}
                            className="flex items-center justify-between rounded-lg border p-4"
                          >
                            <div className="space-y-1">
                              <Link
                                href={`/dashboard/campaigns/${cl.campaignId}`}
                                className="font-medium hover:underline"
                              >
                                {cl.campaign.name}
                              </Link>
                              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Badge variant="outline">
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
                            >
                              {cl.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                        <Megaphone className="mb-2 h-8 w-8 opacity-20" />
                        <p>This lead is not part of any campaigns yet.</p>
                        <Button variant="link" className="mt-2" asChild>
                          <Link href="/dashboard/campaigns">
                            Browse Campaigns
                          </Link>
                        </Button>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedStatus || lead.status}
                  onValueChange={(value) => {
                    setSelectedStatus(value);
                    handleStatusUpdate(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                    <SelectItem value="INTERESTED">Interested</SelectItem>
                    <SelectItem value="WON">Won</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                <div className="space-y-3">
                  <Label>Quick Actions</Label>
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
                        className="cursor-pointer text-sm"
                      >
                        Feedback Needed
                      </Label>
                    </div>
                    <Button
                      onClick={handleQuickSave}
                      disabled={quickSaveMutation.isPending}
                      className="w-full"
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Information</CardTitle>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Details</CardTitle>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
