"use client";

import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import {
  Loader2,
  Plus,
  Search,
  Megaphone,
  Users,
  Filter,
  Clock,
  Edit,
  Trash2,
  ArrowRight,
  BarChart3,
  Target,
  CalendarIcon,
  MoreVertical,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddLeadsForm } from "./_components/add-leads-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CampaignsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addLeadsCampaignId, setAddLeadsCampaignId] = useState<string | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "myteams">("all");
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [selectedCampaignForTeam, setSelectedCampaignForTeam] =
    useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data, isLoading, refetch } = api.campaign.getAll.useQuery({
    search,
  });
  const campaigns = data?.campaigns;

  const { data: myTeamCampaigns, isLoading: loadingMyTeams } =
    api.campaign.getMyTeamCampaigns.useQuery();

  const displayCampaigns = viewMode === "myteams" ? myTeamCampaigns : campaigns;

  const { data: uniqueSources } = api.webhook.getUniqueSources.useQuery();
  const { data: teams = [] } = api.team.getAll.useQuery();

  const utils = api.useUtils();

  const updateCampaign = api.campaign.update.useMutation({
    onSuccess: () => {
      toast.success("Campaign updated successfully");
      setEditOpen(false);
      setEditingCampaign(null);
      utils.campaign.getAll.invalidate();
      utils.campaign.getMyTeamCampaigns.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteCampaign = api.campaign.delete.useMutation({
    onSuccess: () => {
      toast.success("Campaign deleted successfully");
      setDeleteId(null);
      utils.campaign.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingCampaign) return;

    updateCampaign.mutate({
      id: editingCampaign.id,
      name: editingCampaign.name,
      description: editingCampaign.description,
      timelineFilter: editingCampaign.timelineFilter,
      sourceFilter: editingCampaign.sourceFilter,
      type: editingCampaign.type,
      status: editingCampaign.status,
    });
  };

  const handleDelete = (id: string) => {
    deleteCampaign.mutate({ id });
  };

  const handleAssignTeam = (campaign: any) => {
    setSelectedCampaignForTeam(campaign);
    setSelectedTeamId(campaign.teamId || "none");
    setTeamDialogOpen(true);
  };

  const handleSaveTeamAssignment = () => {
    if (!selectedCampaignForTeam) return;

    const updateData: any = {
      id: selectedCampaignForTeam.id,
    };

    // Only include teamId if it's not 'none', otherwise explicitly set to null
    if (selectedTeamId && selectedTeamId !== "none") {
      updateData.teamId = selectedTeamId;
    } else {
      updateData.teamId = null;
    }

    updateCampaign.mutate(updateData);

    setTeamDialogOpen(false);
    setSelectedCampaignForTeam(null);
    setSelectedTeamId("none");
  };

  const getTimelineDisplay = (campaign: any) => {
    if (campaign.timelineFilter === "30_DAYS") return "Last 30 Days";
    if (campaign.timelineFilter === "60_DAYS") return "Last 60 Days";
    if (campaign.timelineFilter === "90_DAYS") return "Last 90 Days";
    if (campaign.timelineFilter === "CUSTOM") {
      if (campaign.customStartDate && campaign.customEndDate) {
        return `${format(new Date(campaign.customStartDate), "MMM d")} - ${format(new Date(campaign.customEndDate), "MMM d, yyyy")}`;
      }
      return "Custom Range";
    }
    return "All Time";
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground">
              Filter and manage leads by timeline and source
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("all")}
          >
            All Campaigns
          </Button>
          <Button
            variant={viewMode === "myteams" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("myteams")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            My Team Campaigns
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading || loadingMyTeams ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : displayCampaigns?.length === 0 ? (
          <Card className="flex h-96 flex-col items-center justify-center text-center">
            <div className="bg-primary/10 rounded-full p-4">
              <Target className="text-primary h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {viewMode === "myteams"
                ? "No team campaigns found"
                : "No campaigns found"}
            </h3>
            <p className="text-muted-foreground mt-2 mb-4 max-w-sm">
              {viewMode === "myteams"
                ? "No campaigns have been assigned to your teams yet"
                : "Create your first campaign to filter and manage leads by timeline and source"}
            </p>
            {viewMode === "all" && (
              <Button asChild>
                <Link href="/dashboard/campaigns/new">Create Campaign</Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayCampaigns?.map((campaign: any) => (
              <Card
                key={campaign.id}
                className="group relative overflow-hidden transition-all hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      {campaign.description && (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAddLeadsCampaignId(campaign.id)}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Leads
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAssignTeam(campaign)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          {campaign.team ? "Change Team" : "Assign Team"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteId(campaign.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge
                      variant={
                        campaign.status === "ACTIVE" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {campaign.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {campaign.type}
                    </Badge>
                    {campaign.team && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        {campaign.team.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filter Info */}
                  <div className="bg-muted/30 space-y-2 rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="text-primary h-4 w-4" />
                      <span className="text-muted-foreground">Timeline:</span>
                      <span className="font-medium">
                        {getTimelineDisplay(campaign)}
                      </span>
                    </div>
                    {campaign.sourceFilter && (
                      <div className="flex items-center gap-2 text-sm">
                        <Filter className="text-primary h-4 w-4" />
                        <span className="text-muted-foreground">Source:</span>
                        <span className="font-medium">
                          {campaign.sourceFilter}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 rounded-lg border p-2">
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" /> Total Leads
                      </span>
                      <span className="text-2xl font-bold">
                        {campaign._count?.leads || 0}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 rounded-lg border p-2">
                      <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Target className="h-3 w-3" /> Members
                      </span>
                      <span className="text-2xl font-bold">
                        {campaign._count?.members || 0}
                      </span>
                    </div>
                  </div>

                  {/* Work Button */}
                  <Button
                    className="w-full"
                    onClick={() =>
                      router.push(`/dashboard/campaigns/${campaign.id}/work`)
                    }
                  >
                    Start Working
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update campaign filters and settings
            </DialogDescription>
          </DialogHeader>
          {editingCampaign && (
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={editingCampaign.name}
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editingCampaign.description || ""}
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Timeline Filter</Label>
                  <Select
                    value={editingCampaign.timelineFilter || ""}
                    onValueChange={(value) =>
                      setEditingCampaign({
                        ...editingCampaign,
                        timelineFilter: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30_DAYS">Last 30 Days</SelectItem>
                      <SelectItem value="60_DAYS">Last 60 Days</SelectItem>
                      <SelectItem value="90_DAYS">Last 90 Days</SelectItem>
                      <SelectItem value="CUSTOM">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source Filter</Label>
                  <Select
                    value={editingCampaign.sourceFilter || "ALL"}
                    onValueChange={(value) =>
                      setEditingCampaign({
                        ...editingCampaign,
                        sourceFilter: value === "ALL" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Sources</SelectItem>
                      {uniqueSources?.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Date Range - Show only when CUSTOM timeline is selected */}
              {editingCampaign.timelineFilter === "CUSTOM" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editingCampaign.customStartDate &&
                              "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editingCampaign.customStartDate ? (
                            format(
                              new Date(editingCampaign.customStartDate),
                              "PPP",
                            )
                          ) : (
                            <span>Pick start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            editingCampaign.customStartDate
                              ? new Date(editingCampaign.customStartDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              customStartDate: date,
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editingCampaign.customEndDate &&
                              "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editingCampaign.customEndDate ? (
                            format(
                              new Date(editingCampaign.customEndDate),
                              "PPP",
                            )
                          ) : (
                            <span>Pick end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            editingCampaign.customEndDate
                              ? new Date(editingCampaign.customEndDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              customEndDate: date,
                            })
                          }
                          disabled={(date) =>
                            editingCampaign.customStartDate
                              ? date < new Date(editingCampaign.customStartDate)
                              : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <Select
                  value={editingCampaign.status}
                  onValueChange={(value) =>
                    setEditingCampaign({ ...editingCampaign, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateCampaign.isPending}
            >
              {updateCampaign.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleteCampaign.isPending}
            >
              {deleteCampaign.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Assignment Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team to Campaign</DialogTitle>
            <DialogDescription>
              Select a team to assign to this campaign. All team members will be
              able to see and work on the campaign leads.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Team</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team or leave empty to remove" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">
                      No Team (Remove Assignment)
                    </span>
                  </SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{team.name}</div>
                          {team.description && (
                            <div className="text-muted-foreground text-xs">
                              {team.description}
                            </div>
                          )}
                        </div>
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
                setTeamDialogOpen(false);
                setSelectedCampaignForTeam(null);
                setSelectedTeamId("none");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTeamAssignment}
              disabled={updateCampaign.isPending}
            >
              {updateCampaign.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Save Team Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leads Dialog */}
      <Dialog
        open={!!addLeadsCampaignId}
        onOpenChange={(open) => !open && setAddLeadsCampaignId(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Leads by Source</DialogTitle>
            <DialogDescription>
              Add all leads from a specific source to this campaign.
            </DialogDescription>
          </DialogHeader>
          {addLeadsCampaignId && (
            <AddLeadsForm
              campaignId={addLeadsCampaignId}
              onSuccess={() => {
                setAddLeadsCampaignId(null);
                refetch();
              }}
              onCancel={() => setAddLeadsCampaignId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
