"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { CampaignSidebar } from "./_components/campaign-sidebar";
import { LeadList } from "./_components/lead-list";
import { LeadWorkspace } from "./_components/lead-workspace";
import { TransferLeadDialog } from "./_components/transfer-lead-dialog";
import { LeadFilterHeader } from "./_components/lead-filter-header";

type LeadType = "NEW" | "ACTIVE";
type ViewMode = "list" | "details";

export default function CampaignWorkPage() {
  const params = useParams();
  const campaignId = params.id as string;

  // State
  const [leadType, setLeadType] = useState<LeadType>("NEW");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [note, setNote] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [revenue, setRevenue] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferToUserId, setTransferToUserId] = useState("");
  const [activeTab, setActiveTab] = useState("activity");
  const [visibleLeadsCount, setVisibleLeadsCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  // Filter leads by category with memoization
  const filteredLeads = useMemo(() => {
    if (!campaign?.leads) return [];

    const filtered = campaign.leads.filter((cl) => {
      if (leadType === "NEW") {
        return cl.lead.category === "FRESH";
      } else {
        return cl.lead.category === "ACTIVE";
      }
    });

    // Sort ACTIVE leads by most recently updated first
    if (leadType === "ACTIVE") {
      return [...filtered].sort((a, b) => {
        const dateA = new Date(a.lead.updatedAt || a.lead.createdAt).getTime();
        const dateB = new Date(b.lead.updatedAt || b.lead.createdAt).getTime();
        return dateB - dateA; // Most recent first
      });
    }

    return filtered;
  }, [campaign?.leads, leadType]);

  const visibleLeads = useMemo(() => {
    return filteredLeads.slice(0, visibleLeadsCount);
  }, [filteredLeads, visibleLeadsCount]);

  // Calculate lead counts by category
  const newLeadsCount = useMemo(() => {
    return (
      campaign?.leads?.filter((cl) => cl.lead.category === "FRESH").length || 0
    );
  }, [campaign?.leads]);

  const activeLeadsCount = useMemo(() => {
    return (
      campaign?.leads?.filter((cl) => cl.lead.category === "ACTIVE").length || 0
    );
  }, [campaign?.leads]);

  const closedLeadsCount = useMemo(() => {
    return (
      campaign?.leads?.filter((cl) => cl.lead.category === "CLOSED").length || 0
    );
  }, [campaign?.leads]);

  // Reset visible count when lead type changes
  useEffect(() => {
    setVisibleLeadsCount(20);
  }, [leadType]);

  // Auto-select first lead when tab changes or when no lead is selected
  useEffect(() => {
    if (filteredLeads.length > 0) {
      // If no lead selected, or selected lead is not in current filtered list, select first lead
      const isSelectedLeadInList = filteredLeads.some(
        (cl) => cl.leadId === selectedLeadId,
      );

      if (!selectedLeadId || !isSelectedLeadInList) {
        setSelectedLeadId(filteredLeads[0]!.leadId);
        // On mobile, show details view when a lead is auto-selected
        if (window.innerWidth < 768) {
          setViewMode("details");
        }
      }
    } else {
      // Clear selection if no leads in current tab
      setSelectedLeadId(null);
      // On mobile, show list view when no leads
      if (window.innerWidth < 768) {
        setViewMode("list");
      }
    }
  }, [filteredLeads, leadType, selectedLeadId]);

  // Infinite scroll implementation
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target?.isIntersecting &&
          visibleLeadsCount < filteredLeads.length
        ) {
          setVisibleLeadsCount((prev) =>
            Math.min(prev + 20, filteredLeads.length),
          );
        }
      },
      { threshold: 0.5, rootMargin: "100px" },
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [visibleLeadsCount, filteredLeads.length]);

  const selectedLead = useMemo(() => {
    if (!selectedLeadId || !campaign?.leads) return null;
    return campaign.leads.find((cl) => cl.leadId === selectedLeadId)?.lead;
  }, [selectedLeadId, campaign?.leads]);

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
      // Reset to activity tab when lead changes
      setActiveTab("activity");
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

  const updateRevenueMutation = api.lead.update.useMutation({
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
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Campaign Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The campaign you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = (status: string) => {
    if (!selectedLeadId) return;
    updateStatusMutation.mutate({
      id: selectedLeadId,
      status,
    });
  };

  const handleAddNote = async () => {
    if (!selectedLeadId || !note.trim()) return;

    // Update lead category to ACTIVE and status to CONTACTED when adding note
    if (
      selectedLead?.category === "FRESH" ||
      selectedLead?.status === "NEW_LEAD"
    ) {
      const updates: any = { id: selectedLeadId };

      if (selectedLead.category === "FRESH") {
        updates.category = "ACTIVE";
      }

      if (selectedLead.status === "NEW_LEAD") {
        updates.status = "CONTACTED";
      }

      await updateLeadMutation.mutateAsync(updates);
    }

    createNoteMutation.mutate({
      leadId: selectedLeadId,
      message: note,
    });
  };

  const handleCreateTask = async () => {
    if (!selectedLeadId || !taskDueAt) return;

    // Update lead category to ACTIVE and status to CONTACTED when creating task
    if (
      selectedLead?.category === "FRESH" ||
      selectedLead?.status === "NEW_LEAD"
    ) {
      const updates: any = { id: selectedLeadId };

      if (selectedLead.category === "FRESH") {
        updates.category = "ACTIVE";
      }

      if (selectedLead.status === "NEW_LEAD") {
        updates.status = "CONTACTED";
      }

      await updateLeadMutation.mutateAsync(updates);
    }

    createTaskMutation.mutate({
      leadId: selectedLeadId,
      note: taskNote || "Follow-up",
      dueAt: new Date(taskDueAt),
    });
  };

  const handleCall = async () => {
    if (!selectedLead) return;

    // Update lead category to ACTIVE and status to CONTACTED when making a call
    if (selectedLeadId) {
      const updates: any = { id: selectedLeadId };

      if (selectedLead.category === "FRESH") {
        updates.category = "ACTIVE";
      }

      if (selectedLead.status === "NEW_LEAD") {
        updates.status = "CONTACTED";
      }

      if (updates.category || updates.status) {
        await updateLeadMutation.mutateAsync(updates);
      }
    }

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

    const updates: any = {
      id: selectedLeadId,
      ...editedLead,
    };

    // Automatically move to ACTIVE category if it was FRESH
    if (selectedLead?.category === "FRESH") {
      updates.category = "ACTIVE";
    }

    // Update status to CONTACTED if still NEW_LEAD
    if (selectedLead?.status === "NEW_LEAD") {
      updates.status = "CONTACTED";
    }

    updateLeadMutation.mutate(updates);
  };

  const handleTransferLead = () => {
    if (!selectedLeadId || !transferToUserId) return;
    transferLeadMutation.mutate({
      leadId: selectedLeadId,
      ownerId: transferToUserId,
    });
  };

  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId(leadId);
    // On mobile, switch to details view
    if (window.innerWidth < 768) {
      setViewMode("details");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
  };

  return (
    <PageContainer>
      <ScrollArea className="h-[calc(100dvh-52px)] p-0">
        <div className="flex h-[calc(100dvh-52px)] flex-col overflow-hidden">
          {/* Mobile Header with Menu Button */}
          <div className="bg-card border-b p-4 md:hidden">
            <div className="flex items-center justify-between">
              {viewMode === "details" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="mr-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLeftPanelOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h1 className="truncate text-lg font-semibold">
                {viewMode === "details" && selectedLead
                  ? `${selectedLead.firstName} ${selectedLead.lastName}`
                  : campaign.name}
              </h1>
              <div className="w-9"></div> {/* Spacer for centering */}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* LEFT PANEL - Campaign Overview */}
            <CampaignSidebar
              campaign={campaign}
              leftPanelOpen={leftPanelOpen}
              setLeftPanelOpen={setLeftPanelOpen}
              newLeadsCount={newLeadsCount}
              activeLeadsCount={activeLeadsCount}
              closedLeadsCount={closedLeadsCount}
            />

            {/* MIDDLE + RIGHT PANEL */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {/* Top Bar with Tabs - Only show in list view on mobile */}
              <LeadFilterHeader
                viewMode={viewMode}
                leadType={leadType}
                setLeadType={setLeadType}
                newLeadsCount={newLeadsCount}
                activeLeadsCount={activeLeadsCount}
                totalLeadsCount={filteredLeads.length}
              />

              {/* Main Content Area */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* MIDDLE PANEL - Lead List */}
                <LeadList
                  viewMode={viewMode}
                  leadType={leadType}
                  filteredLeads={filteredLeads}
                  visibleLeads={visibleLeads}
                  visibleLeadsCount={visibleLeadsCount}
                  loadMoreRef={loadMoreRef}
                  selectedLeadId={selectedLeadId}
                  handleLeadClick={handleLeadClick}
                />

                {/* RIGHT PANEL - Lead Workspace */}
                <LeadWorkspace
                  selectedLead={selectedLead}
                  selectedLeadId={selectedLeadId}
                  viewMode={viewMode}
                  handleBackToList={handleBackToList}
                  handleCall={handleCall}
                  handleWhatsApp={handleWhatsApp}
                  handleEmail={handleEmail}
                  handleSMS={handleSMS}
                  setTransferDialogOpen={setTransferDialogOpen}
                  handleStatusUpdate={handleStatusUpdate}
                  revenue={revenue}
                  setRevenue={setRevenue}
                  updateRevenueMutation={updateRevenueMutation}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isEditMode={isEditMode}
                  setIsEditMode={setIsEditMode}
                  editedLead={editedLead}
                  setEditedLead={setEditedLead}
                  handleSaveLeadEdits={handleSaveLeadEdits}
                  updateLeadMutation={updateLeadMutation}
                  activities={activities}
                  tasks={tasks}
                  taskDueAt={taskDueAt}
                  setTaskDueAt={setTaskDueAt}
                  taskNote={taskNote}
                  setTaskNote={setTaskNote}
                  handleCreateTask={handleCreateTask}
                  createTaskMutation={createTaskMutation}
                  note={note}
                  setNote={setNote}
                  handleAddNote={handleAddNote}
                  createNoteMutation={createNoteMutation}
                />
              </div>
            </div>
          </div>

          {/* Transfer Lead Dialog */}
          <TransferLeadDialog
            open={transferDialogOpen}
            onOpenChange={setTransferDialogOpen}
            transferToUserId={transferToUserId}
            setTransferToUserId={setTransferToUserId}
            campaign={campaign}
            selectedLead={selectedLead}
            handleTransferLead={handleTransferLead}
            transferLeadMutation={transferLeadMutation}
          />
        </div>
      </ScrollArea>
    </PageContainer>
  );
}
