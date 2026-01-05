"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  Star,
  Loader2,
  Activity,
  Clock,
  Tag,
  PhoneCall,
  Plus,
  StickyNote,
  ListTodo,
  Send,
  Edit,
  Calendar,
  ArrowRightLeft,
  Save,
  X,
  Target,
  Code,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLeadStatuses } from "@/hooks/use-lead-statuses";

const renderActivityMessage = (message: string | null | undefined) => {
  if (!message) return null;

  // Check if message contains "Received Data:" marker
  const parts = message.split("Received Data:");

  // If no marker found, just return the message as is
  if (parts.length < 2) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {message}
      </p>
    );
  }

  const mainMessage = parts[0].trim();
  const jsonString = parts.slice(1).join("Received Data:").trim();

  let jsonData = null;
  try {
    jsonData = JSON.parse(jsonString);
  } catch (e) {
    // If parsing fails, return original message
    return (
      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {message}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {mainMessage && (
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
          {mainMessage}
        </p>
      )}

      {jsonData && typeof jsonData === "object" && (
        <div className="bg-card/50 overflow-hidden rounded-md border text-xs">
          <div className="bg-muted/50 flex items-center gap-2 border-b px-3 py-2">
            <Code className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground font-medium">
              Webhook Data Payload
            </span>
          </div>
          <div className="grid gap-y-2 p-3">
            {Object.entries(jsonData).map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-[120px_1fr] items-start gap-2"
              >
                <span
                  className="text-muted-foreground truncate font-medium"
                  title={key}
                >
                  {key}
                </span>
                <span className="text-foreground bg-muted/30 rounded px-1.5 py-0.5 font-mono break-all">
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

type ViewMode = "list" | "details";

interface LeadWorkspaceProps {
  selectedLead: any;
  selectedLeadId: string | null;
  viewMode: ViewMode;
  handleBackToList: () => void;
  handleCall: () => void;
  handleWhatsApp: () => void;
  handleEmail: () => void;
  handleSMS: () => void;
  setTransferDialogOpen: (open: boolean) => void;
  handleStatusUpdate: (status: string) => void;
  revenue: string;
  setRevenue: (revenue: string) => void;
  updateRevenueMutation: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  editedLead: any;
  setEditedLead: (lead: any) => void;
  handleSaveLeadEdits: () => void;
  updateLeadMutation: any;
  activities: any[];
  tasks: any[];
  taskDueAt: string;
  setTaskDueAt: (date: string) => void;
  taskNote: string;
  setTaskNote: (note: string) => void;
  handleCreateTask: () => void;
  createTaskMutation: any;
  note: string;
  setNote: (note: string) => void;
  handleAddNote: () => void;
  createNoteMutation: any;
}

export function LeadWorkspace({
  selectedLead,
  selectedLeadId,
  viewMode,
  handleBackToList,
  handleCall,
  handleWhatsApp,
  handleEmail,
  handleSMS,
  setTransferDialogOpen,
  handleStatusUpdate,
  revenue,
  setRevenue,
  updateRevenueMutation,
  activeTab,
  setActiveTab,
  isEditMode,
  setIsEditMode,
  editedLead,
  setEditedLead,
  handleSaveLeadEdits,
  updateLeadMutation,
  activities,
  tasks,
  taskDueAt,
  setTaskDueAt,
  taskNote,
  setTaskNote,
  handleCreateTask,
  createTaskMutation,
  note,
  setNote,
  handleAddNote,
  createNoteMutation,
}: LeadWorkspaceProps) {
  // Fetch custom lead statuses
  const { categories: statusCategories, isLoading: isLoadingStatuses } =
    useLeadStatuses();

  return (
    <div
      className={cn(
        "hidden min-h-0 flex-1 flex-col overflow-hidden md:flex",
        viewMode === "details" &&
          typeof window !== "undefined" &&
          window.innerWidth < 768
          ? "flex"
          : "",
      )}
    >
      {/* Mobile Header for Details View */}
      <div className="bg-card border-b p-4 md:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToList}
            className="mr-2"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="truncate text-lg font-semibold">
            {selectedLead
              ? `${selectedLead.firstName} ${selectedLead.lastName}`
              : "Lead Details"}
          </h1>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
      </div>

      {selectedLead ? (
        <>
          {/* Lead Header */}
          <div className="bg-card border-b p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {selectedLead.firstName} {selectedLead.lastName}
                </h2>
                <div className="text-muted-foreground mt-1 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-2">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{selectedLead.phone}</span>
                  </div>
                  {selectedLead.email && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{selectedLead.email}</span>
                      </div>
                    </>
                  )}
                </div>
                {/* Assigned Agent */}
                {(selectedLead as any).owner && (
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={(selectedLead as any).owner.image || undefined}
                      />
                      <AvatarFallback className="text-[10px]">
                        {(selectedLead as any).owner.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-xs">
                      Assigned to:{" "}
                      <strong>{(selectedLead as any).owner.name}</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1 px-2 text-xs"
                      onClick={() => setTransferDialogOpen(true)}
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      Transfer
                    </Button>
                  </div>
                )}
              </div>
              {selectedLead.priority === "URGENT" && (
                <Badge variant="destructive" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Urgent
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleCall}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <PhoneCall className="h-4 w-4" />
                <span className="hidden sm:inline">Call Now</span>
                <span className="sm:hidden">Call</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleWhatsApp}
                disabled={!selectedLead?.phone}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleEmail}
                disabled={!selectedLead?.email}
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleSMS}
                disabled={!selectedLead?.phone}
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">SMS</span>
              </Button>
            </div>
          </div>

          {/* Status & Details Bar */}
          <div className="bg-muted/50 border-b p-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <Select
                  value={selectedLead.status}
                  onValueChange={handleStatusUpdate}
                  disabled={isLoadingStatuses}
                >
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusCategories.map((category) => (
                      <div key={category.value}>
                        <div className="text-muted-foreground px-2 py-1.5 text-sm font-semibold">
                          {category.label}
                        </div>
                        {category.statuses.map((status) => (
                          <SelectItem key={status.id} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Source</Label>
                <p className="mt-1.5 text-sm font-medium capitalize">
                  {selectedLead.source?.toLowerCase().replace(/_/g, " ") ||
                    "Unknown"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Revenue (₹)
                </Label>
                <div className="mt-1 flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="0"
                    value={revenue || (selectedLead as any).revenue || ""}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    disabled={!revenue || updateRevenueMutation.isPending}
                    onClick={() => {
                      if (revenue && selectedLeadId) {
                        const updates: any = {
                          id: selectedLeadId,
                          revenue: parseFloat(revenue) || 0,
                          category: "ACTIVE",
                        };

                        // Update status to CONTACTED if still NEW_LEAD
                        if (selectedLead.status === "NEW_LEAD") {
                          updates.status = "CONTACTED";
                        }

                        updateRevenueMutation.mutate(updates);
                      }
                    }}
                  >
                    {updateRevenueMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
              <TabsTrigger value="details" className="gap-1 text-xs sm:gap-2">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1 text-xs sm:gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1 text-xs sm:gap-2">
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs sm:gap-2">
                <StickyNote className="h-4 w-4" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
            </TabsList>

            {/* Details Tab - Lead Edit Form */}
            <TabsContent value="details" className="m-0 h-[50vh] overflow-auto">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Lead Information</h3>
                    {!isEditMode ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditMode(true)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditMode(false);
                            if (selectedLead) {
                              setEditedLead({
                                firstName: selectedLead.firstName || "",
                                lastName: selectedLead.lastName || "",
                                email: selectedLead.email || "",
                                phone: selectedLead.phone || "",
                                courseInterested:
                                  (selectedLead as any).courseInterested || "",
                                city: selectedLead.city || "",
                                state: selectedLead.state || "",
                                priority: selectedLead.priority || "MEDIUM",
                                revenue: (selectedLead as any).revenue || 0,
                              });
                            }
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveLeadEdits}
                          disabled={updateLeadMutation.isPending}
                        >
                          {updateLeadMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4">
                    {/* Personal Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                              id="firstName"
                              value={editedLead.firstName || ""}
                              onChange={(e) =>
                                setEditedLead({
                                  ...editedLead,
                                  firstName: e.target.value,
                                })
                              }
                              disabled={!isEditMode}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={editedLead.lastName || ""}
                              onChange={(e) =>
                                setEditedLead({
                                  ...editedLead,
                                  lastName: e.target.value,
                                })
                              }
                              disabled={!isEditMode}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                              id="phone"
                              value={editedLead.phone || ""}
                              onChange={(e) =>
                                setEditedLead({
                                  ...editedLead,
                                  phone: e.target.value,
                                })
                              }
                              disabled={!isEditMode}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={editedLead.email || ""}
                              onChange={(e) =>
                                setEditedLead({
                                  ...editedLead,
                                  email: e.target.value,
                                })
                              }
                              disabled={!isEditMode}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Course Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Course Interest
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="courseInterested">
                            Course Interested
                          </Label>
                          <Input
                            id="courseInterested"
                            value={editedLead.courseInterested || ""}
                            onChange={(e) =>
                              setEditedLead({
                                ...editedLead,
                                courseInterested: e.target.value,
                              })
                            }
                            disabled={!isEditMode}
                            placeholder="e.g., JEE, NEET, IIT Foundation"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Location</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={editedLead.city || ""}
                              onChange={(e) =>
                                setEditedLead({
                                  ...editedLead,
                                  city: e.target.value,
                                })
                              }
                              disabled={!isEditMode}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={editedLead.state || ""}
                              onChange={(e) =>
                                setEditedLead({
                                  ...editedLead,
                                  state: e.target.value,
                                })
                              }
                              disabled={!isEditMode}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Priority & Revenue */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Priority & Revenue
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                              value={editedLead.priority || "MEDIUM"}
                              onValueChange={(value) =>
                                setEditedLead({
                                  ...editedLead,
                                  priority: value,
                                })
                              }
                              disabled={!isEditMode}
                            >
                              <SelectTrigger id="priority">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="revenue">Revenue (₹)</Label>
                            <Input
                              id="revenue"
                              type="number"
                              value={editedLead.revenue || ""}
                              onChange={(e) =>
                                setEditedLead({
                                  ...editedLead,
                                  revenue: parseFloat(e.target.value) || 0,
                                })
                              }
                              disabled={!isEditMode}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedLead?.category === "FRESH" && isEditMode && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Automatic Category Update
                            </h4>
                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                              When you save these changes, this lead will
                              automatically move to the <strong>ACTIVE</strong>{" "}
                              category since you're engaging with it.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent
              value="activity"
              className="m-0 h-[50vh] overflow-auto"
            >
              <ScrollArea className="h-full">
                <div className="p-4">
                  {activities.length === 0 ? (
                    <div className="py-12 text-center">
                      <Activity className="mx-auto mb-3 h-12 w-12 opacity-20" />
                      <p className="text-muted-foreground text-sm">
                        No activity yet
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Start engaging with this lead to see activity here.
                      </p>
                    </div>
                  ) : (
                    <div className="border-muted relative ml-4 space-y-6 border-l-2 pl-6">
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
                                bgColor: "bg-purple-50 dark:bg-purple-900/20",
                                borderColor:
                                  "border-purple-200 dark:border-purple-800",
                              };
                            case "EDIT":
                              return {
                                color: "bg-orange-500",
                                icon: Edit,
                                bgColor: "bg-orange-50 dark:bg-orange-900/20",
                                borderColor:
                                  "border-orange-200 dark:border-orange-800",
                              };
                            case "NOTE":
                              return {
                                color: "bg-yellow-500",
                                icon: StickyNote,
                                bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
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
                            case "WHATSAPP":
                              return {
                                color: "bg-green-500",
                                icon: MessageSquare,
                                bgColor: "bg-green-50 dark:bg-green-900/20",
                                borderColor:
                                  "border-green-200 dark:border-green-800",
                              };
                            case "SMS":
                              return {
                                color: "bg-indigo-500",
                                icon: MessageSquare,
                                bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
                                borderColor:
                                  "border-indigo-200 dark:border-indigo-800",
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
                            <span className="bg-background ring-muted absolute top-1 -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-2">
                              <div
                                className={`${color} h-3 w-3 rounded-full`}
                              />
                            </span>
                            <div
                              className={`rounded-lg border p-3 ${bgColor} ${borderColor}`}
                            >
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ActivityIcon
                                      className={`h-4 w-4 ${color.replace("bg-", "text-")}`}
                                    />
                                    <span className="text-sm font-medium capitalize">
                                      {activity.type
                                        .replace(/_/g, " ")
                                        .toLowerCase()}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground text-xs">
                                    {format(
                                      new Date(activity.createdAt),
                                      "MMM d, h:mm a",
                                    )}
                                  </span>
                                </div>
                                {activity.subject && (
                                  <p className="text-sm font-medium">
                                    {activity.subject}
                                  </p>
                                )}
                                {renderActivityMessage(
                                  (activity as any).message ||
                                    activity.description,
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="m-0 h-[50vh] overflow-auto">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {/* Schedule New Task */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        Schedule Follow-up
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="task-due" className="text-xs">
                          Due Date & Time
                        </Label>
                        <Input
                          id="task-due"
                          type="datetime-local"
                          value={taskDueAt}
                          onChange={(e) => setTaskDueAt(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-note" className="text-xs">
                          Note (Optional)
                        </Label>
                        <Input
                          id="task-note"
                          placeholder="e.g. Follow up on pricing"
                          value={taskNote}
                          onChange={(e) => setTaskNote(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCreateTask}
                        disabled={!taskDueAt || createTaskMutation.isPending}
                        className="w-full"
                      >
                        {createTaskMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Clock className="mr-2 h-4 w-4" />
                        )}
                        Schedule Task
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Tasks List */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">
                      Upcoming Tasks
                    </h3>
                    {tasks.length === 0 ? (
                      <div className="py-8 text-center">
                        <ListTodo className="mx-auto mb-3 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground text-sm">
                          No tasks scheduled
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task: any) => (
                          <Card key={task.id}>
                            <CardContent className="p-3">
                              <div className="mb-1 flex items-start justify-between">
                                <span className="text-sm font-medium">
                                  {task.title || "Follow-up"}
                                </span>
                                <Badge
                                  variant={
                                    task.status === "COMPLETED"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {task.status}
                                </Badge>
                              </div>
                              {task.note && (
                                <p className="text-muted-foreground mb-2 text-xs">
                                  {task.note}
                                </p>
                              )}
                              {task.dueDate && (
                                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                  <Clock className="h-3 w-3" />
                                  {format(
                                    new Date(task.dueDate),
                                    "MMM d, yyyy h:mm a",
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="m-0 h-[50vh] overflow-auto">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  {/* Add Note */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Add Note</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        placeholder="Type your note here..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={!note.trim() || createNoteMutation.isPending}
                        className="w-full"
                      >
                        {createNoteMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Add Note
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Notes filtered from activities */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">All Notes</h3>
                    {activities.filter((a) => a.type === "NOTE").length ===
                    0 ? (
                      <div className="py-8 text-center">
                        <StickyNote className="mx-auto mb-3 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground text-sm">
                          No notes yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activities
                          .filter((a) => a.type === "NOTE")
                          .map((activity) => (
                            <Card key={activity.id}>
                              <CardContent className="p-3">
                                <div className="mb-2 flex items-start justify-between">
                                  <span className="text-muted-foreground text-xs">
                                    {format(
                                      new Date(activity.createdAt),
                                      "MMM d, yyyy h:mm a",
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm">
                                  {activity.message || activity.description}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Target className="mx-auto mb-4 h-16 w-16 opacity-20" />
            <p className="text-muted-foreground">
              Select a lead to start working
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
