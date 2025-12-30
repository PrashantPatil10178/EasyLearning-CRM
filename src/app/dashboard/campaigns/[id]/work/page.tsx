"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  Star,
  Loader2,
  Activity,
  Clock,
  MapPin,
  Tag,
  PieChart,
  Users,
  Target,
  Menu,
  X,
  PhoneCall,
  Plus,
  StickyNote,
  ListTodo,
  Send,
  Edit,
  Calendar,
  DollarSign,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LEAD_STATUS_HIERARCHY,
  statusStyles,
  statusDisplayNames,
} from "@/lib/lead-status";

type LeadType = "NEW" | "ACTIVE";

export default function CampaignWorkPage() {
  const params = useParams();
  const campaignId = params.id as string;

  // State
  const [leadType, setLeadType] = useState<LeadType>("NEW");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [note, setNote] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [revenue, setRevenue] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferToUserId, setTransferToUserId] = useState("");

  // Editable lead fields
  const [editedLead, setEditedLead] = useState<any>({});

  // API Queries
  const {
    data: campaign,
    isLoading: campaignLoading,
    refetch: refetchCampaign,
  } = api.campaign.getById.useQuery({
    id: campaignId,
  });

  // Filter leads by category
  const filteredLeads =
    campaign?.leads.filter((cl) => {
      if (leadType === "NEW") {
        return cl.lead.category === "FRESH";
      } else {
        return cl.lead.category === "ACTIVE";
      }
    }) || [];

  const selectedLead = filteredLeads.find(
    (cl) => cl.leadId === selectedLeadId,
  )?.lead;

  // Auto-select first lead
  useEffect(() => {
    if (filteredLeads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(filteredLeads[0]!.leadId);
    }
  }, [filteredLeads, selectedLeadId]);

  // Reset revenue and load lead data when lead changes
  useEffect(() => {
    if (selectedLead) {
      setRevenue((selectedLead as any).revenue?.toString() || "");
      setEditedLead({
        firstName: selectedLead.firstName || "",
        lastName: selectedLead.lastName || "",
        email: selectedLead.email || "",
        phone: selectedLead.phone || "",
        courseInterested: (selectedLead as any).courseInterested || "",
        city: selectedLead.city || "",
        state: selectedLead.state || "",
        priority: selectedLead.priority || "MEDIUM",
        revenue: (selectedLead as any).revenue || 0,
      });
      setIsEditMode(false);
    }
  }, [selectedLeadId, selectedLead]);

  // Get lead activities
  const { data: activities = [], refetch: refetchActivities } =
    api.activity.getByLeadId.useQuery(
      { leadId: selectedLeadId! },
      { enabled: !!selectedLeadId },
    );

  // Get lead tasks
  const { data: tasks = [], refetch: refetchTasks } =
    api.task.getByLeadId.useQuery(
      { leadId: selectedLeadId! },
      { enabled: !!selectedLeadId },
    );

  // Mutations
  const updateStatusMutation = api.lead.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      refetchCampaign();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createNoteMutation = api.activity.addNote.useMutation({
    onSuccess: () => {
      toast.success("Note added successfully");
      setNote("");
      refetchActivities();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createTaskMutation = api.task.create.useMutation({
    onSuccess: () => {
      toast.success("Task scheduled successfully");
      setTaskNote("");
      setTaskDueAt("");
      refetchActivities();
      refetchTasks();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateRevenueMutation = api.lead.quickSave.useMutation({
    onSuccess: () => {
      toast.success("Revenue updated successfully");
      refetchCampaign();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update revenue");
    },
  });

  const updateLeadMutation = api.lead.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      setIsEditMode(false);
      refetchCampaign();
      refetchActivities();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update lead");
    },
  });

  const transferLeadMutation = api.lead.assign.useMutation({
    onSuccess: () => {
      toast.success("Lead transferred successfully");
      setTransferDialogOpen(false);
      setTransferToUserId("");
      refetchCampaign();
      refetchActivities();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to transfer lead");
    },
  });

  if (campaignLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Campaign Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The campaign you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const newLeadsCount = campaign.leads.filter(
    (cl) => cl.lead.category === "FRESH",
  ).length;
  const activeLeadsCount = campaign.leads.filter(
    (cl) => cl.lead.category === "ACTIVE",
  ).length;

  const handleStatusUpdate = (status: string) => {
    if (!selectedLeadId) return;
    updateStatusMutation.mutate({
      id: selectedLeadId,
      status,
    });
  };

  const handleAddNote = () => {
    if (!selectedLeadId || !note.trim()) return;
    createNoteMutation.mutate({
      leadId: selectedLeadId,
      message: note,
    });
  };

  const handleCreateTask = () => {
    if (!selectedLeadId || !taskDueAt) return;
    createTaskMutation.mutate({
      leadId: selectedLeadId,
      note: taskNote || "Follow-up",
      dueAt: new Date(taskDueAt),
    });
  };

  const handleCall = async () => {
    if (!selectedLead) return;
    try {
      const response = await fetch("/api/callerdesk/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          phone: selectedLead.phone,
        }),
      });
      if (response.ok) {
        toast.success("Call initiated successfully!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to initiate call");
      }
    } catch (error) {
      toast.error("Failed to connect to CallerDesk");
    }
  };

  const handleWhatsApp = () => {
    if (!selectedLead?.phone) return;
    const phone = selectedLead.phone.replace(/\D/g, "");
    const waPhone = phone.startsWith("91") ? phone : `91${phone}`;
    window.open(`https://wa.me/${waPhone}`, "_blank");
  };

  const handleEmail = () => {
    if (!selectedLead?.email) return;
    window.open(`mailto:${selectedLead.email}`, "_blank");
  };

  const handleSMS = () => {
    if (!selectedLead?.phone) return;
    window.open(`sms:${selectedLead.phone}`, "_blank");
  };

  const handleSaveLeadEdits = () => {
    if (!selectedLeadId) return;
    updateLeadMutation.mutate({
      id: selectedLeadId,
      ...editedLead,
      // Automatically move to ACTIVE category if it was FRESH
      category:
        selectedLead?.category === "FRESH" ? "ACTIVE" : selectedLead?.category,
    });
  };

  const handleTransferLead = () => {
    if (!selectedLeadId || !transferToUserId) return;
    transferLeadMutation.mutate({
      leadId: selectedLeadId,
      ownerId: transferToUserId,
    });
  };

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      {/* LEFT PANEL - Campaign Overview */}
      <div
        className={cn(
          "bg-card flex-shrink-0 border-r transition-all duration-300",
          leftPanelOpen ? "w-80" : "w-0",
          "lg:w-80",
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Campaign Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="line-clamp-1 text-lg font-bold">
                {campaign.name}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setLeftPanelOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {campaign.description || "Campaign workspace"}
            </p>
          </div>

          <Separator className="mb-4" />

          {/* Stats Grid */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="text-xl font-bold">{campaign.leads.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Converted</p>
                    <p className="text-xl font-bold">
                      {campaign.convertedLeads}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Type Distribution */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <PieChart className="h-4 w-4" />
                Lead Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  New Leads
                </span>
                <span className="font-semibold">{newLeadsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Active Leads
                </span>
                <span className="font-semibold">{activeLeadsCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                {campaign.team ? (
                  <>Team: {campaign.team.name}</>
                ) : (
                  <>Team ({campaign.members.length})</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                {campaign.team && campaign.team.members ? (
                  <div className="space-y-2">
                    {campaign.team.members.map((teamMember) => (
                      <div
                        key={teamMember.id}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={teamMember.user.image || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {teamMember.user.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">
                          {teamMember.user.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaign.members.length > 0 ? (
                      campaign.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm">
                            {member.user.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground py-4 text-center text-xs">
                        No team assigned
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MIDDLE + RIGHT PANEL */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar with Tabs */}
        <div className="bg-card border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setLeftPanelOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Tabs
                value={leadType}
                onValueChange={(v) => setLeadType(v as LeadType)}
              >
                <TabsList className="h-11">
                  <TabsTrigger
                    value="NEW"
                    className="px-6 text-base font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      New
                      <Badge variant="secondary" className="ml-1">
                        {newLeadsCount}
                      </Badge>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="ACTIVE"
                    className="px-6 text-base font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Active
                      <Badge variant="secondary" className="ml-1">
                        {activeLeadsCount}
                      </Badge>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="text-muted-foreground text-sm">
              {filteredLeads.length} leads in {leadType.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* MIDDLE PANEL - Lead List */}
          <div className="w-full flex-shrink-0 border-r md:w-96">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Target className="mb-3 h-12 w-12 opacity-20" />
                    <p className="text-muted-foreground">
                      No {leadType.toLowerCase()} leads
                    </p>
                  </div>
                ) : (
                  filteredLeads.map((cl) => (
                    <button
                      key={cl.leadId}
                      onClick={() => setSelectedLeadId(cl.leadId)}
                      className={cn(
                        "w-full rounded-lg p-3 text-left transition-colors",
                        "hover:bg-accent",
                        selectedLeadId === cl.leadId
                          ? "bg-accent border-primary border-2"
                          : "border border-transparent",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Agent Name */}
                          {cl.lead.owner && (
                            <div className="mb-1 flex items-center gap-1.5">
                              <Avatar className="h-4 w-4">
                                <AvatarImage
                                  src={cl.lead.owner.image || undefined}
                                />
                                <AvatarFallback className="text-[8px]">
                                  {cl.lead.owner.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-muted-foreground text-xs">
                                {cl.lead.owner.name}
                              </span>
                            </div>
                          )}
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="truncate font-semibold">
                              {cl.lead.firstName} {cl.lead.lastName}
                            </h3>
                            {cl.lead.priority === "URGENT" && (
                              <Star className="h-4 w-4 fill-red-500 text-red-500" />
                            )}
                          </div>
                          <div className="text-muted-foreground mb-1 flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{cl.lead.phone}</span>
                          </div>
                          <Badge
                            className={cn(
                              "text-xs",
                              statusStyles[
                                cl.lead.status as keyof typeof statusStyles
                              ],
                            )}
                          >
                            {
                              statusDisplayNames[
                                cl.lead
                                  .status as keyof typeof statusDisplayNames
                              ]
                            }
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT PANEL - Lead Workspace */}
          <div className="hidden flex-1 flex-col overflow-hidden md:flex">
            {selectedLead ? (
              <>
                {/* Lead Header */}
                <div className="bg-card border-b p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </h2>
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3" />
                        {selectedLead.phone}
                        {selectedLead.email && (
                          <>
                            <span>•</span>
                            <Mail className="h-3 w-3" />
                            {selectedLead.email}
                          </>
                        )}
                      </div>
                      {/* Assigned Agent */}
                      {(selectedLead as any).owner && (
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={
                                (selectedLead as any).owner.image || undefined
                              }
                            />
                            <AvatarFallback className="text-[10px]">
                              {(selectedLead as any).owner.name?.charAt(0) ||
                                "?"}
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
                      Call Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={handleWhatsApp}
                      disabled={!selectedLead?.phone}
                    >
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={handleEmail}
                      disabled={!selectedLead?.email}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={handleSMS}
                      disabled={!selectedLead?.phone}
                    >
                      <Send className="h-4 w-4" />
                      SMS
                    </Button>
                  </div>
                </div>

                {/* Status & Details Bar */}
                <div className="bg-muted/50 border-b p-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Status
                      </Label>
                      <Select
                        value={selectedLead.status}
                        onValueChange={handleStatusUpdate}
                      >
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUS_HIERARCHY.map((category) => (
                            <div key={category.value}>
                              <div className="text-muted-foreground px-2 py-1.5 text-sm font-semibold">
                                {category.label}
                              </div>
                              {category.statuses.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                >
                                  {status.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Source
                      </Label>
                      <p className="mt-1.5 text-sm font-medium capitalize">
                        {selectedLead.source
                          ?.toLowerCase()
                          .replace(/_/g, " ") || "Unknown"}
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
                          onBlur={() => {
                            if (revenue && selectedLeadId) {
                              updateRevenueMutation.mutate({
                                id: selectedLeadId,
                                revenue: parseFloat(revenue) || 0,
                              });
                            }
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs
                  defaultValue="details"
                  className="flex flex-1 flex-col overflow-hidden"
                >
                  <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
                    <TabsTrigger value="details" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Details
                    </TabsTrigger>
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
                  </TabsList>

                  {/* Details Tab - Lead Edit Form */}
                  <TabsContent
                    value="details"
                    className="m-0 flex-1 overflow-hidden"
                  >
                    <ScrollArea className="h-full">
                      <div className="space-y-4 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Lead Information
                          </h3>
                          {!isEditMode ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsEditMode(true)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
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
                                        (selectedLead as any)
                                          .courseInterested || "",
                                      city: selectedLead.city || "",
                                      state: selectedLead.state || "",
                                      priority:
                                        selectedLead.priority || "MEDIUM",
                                      revenue:
                                        (selectedLead as any).revenue || 0,
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
                                Save Changes
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
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="firstName">
                                    First Name *
                                  </Label>
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

                              <div className="grid grid-cols-2 gap-4">
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
                              <CardTitle className="text-sm">
                                Location
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                              <div className="grid grid-cols-2 gap-4">
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
                              <div className="grid grid-cols-2 gap-4">
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
                                      <SelectItem value="MEDIUM">
                                        Medium
                                      </SelectItem>
                                      <SelectItem value="HIGH">High</SelectItem>
                                      <SelectItem value="URGENT">
                                        Urgent
                                      </SelectItem>
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
                                        revenue:
                                          parseFloat(e.target.value) || 0,
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
                                    automatically move to the{" "}
                                    <strong>ACTIVE</strong> category since
                                    you're engaging with it.
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
                    className="m-0 flex-1 overflow-hidden"
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
                              Start engaging with this lead to see activity
                              here.
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
                                      bgColor:
                                        "bg-green-50 dark:bg-green-900/20",
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
                                      bgColor:
                                        "bg-green-50 dark:bg-green-900/20",
                                      borderColor:
                                        "border-green-200 dark:border-green-800",
                                    };
                                  case "WHATSAPP":
                                    return {
                                      color: "bg-green-500",
                                      icon: MessageSquare,
                                      bgColor:
                                        "bg-green-50 dark:bg-green-900/20",
                                      borderColor:
                                        "border-green-200 dark:border-green-800",
                                    };
                                  case "SMS":
                                    return {
                                      color: "bg-indigo-500",
                                      icon: MessageSquare,
                                      bgColor:
                                        "bg-indigo-50 dark:bg-indigo-900/20",
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
                                      <p className="text-muted-foreground text-sm leading-relaxed">
                                        {(activity as any).message ||
                                          activity.description}
                                      </p>
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
                  <TabsContent
                    value="tasks"
                    className="m-0 flex-1 overflow-hidden"
                  >
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
                              disabled={
                                !taskDueAt || createTaskMutation.isPending
                              }
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
                  <TabsContent
                    value="notes"
                    className="m-0 flex-1 overflow-hidden"
                  >
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
                              disabled={
                                !note.trim() || createNoteMutation.isPending
                              }
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
                          <h3 className="mb-3 text-sm font-semibold">
                            All Notes
                          </h3>
                          {activities.filter((a) => a.type === "NOTE")
                            .length === 0 ? (
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
                                        {activity.message ||
                                          activity.description}
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
        </div>
      </div>

      {/* Transfer Lead Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Lead</DialogTitle>
            <DialogDescription>
              Transfer this lead to another team member. They will receive full
              ownership and responsibility.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-to">Transfer To</Label>
              <Select
                value={transferToUserId}
                onValueChange={setTransferToUserId}
              >
                <SelectTrigger id="transfer-to">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {/* Show team members if team is assigned, otherwise show campaign members */}
                  {campaign?.team && campaign.team.members
                    ? campaign.team.members
                        .filter(
                          (tm) => tm.userId !== (selectedLead as any)?.ownerId,
                        )
                        .map((teamMember) => (
                          <SelectItem
                            key={teamMember.userId}
                            value={teamMember.userId}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={teamMember.user.image || undefined}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {teamMember.user.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{teamMember.user.name}</span>
                            </div>
                          </SelectItem>
                        ))
                    : campaign?.members
                        .filter(
                          (m) => m.userId !== (selectedLead as any)?.ownerId,
                        )
                        .map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={member.user.image || undefined}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {member.user.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.user.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransferDialogOpen(false);
                setTransferToUserId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransferLead}
              disabled={!transferToUserId || transferLeadMutation.isPending}
            >
              {transferLeadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transfer Lead
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
