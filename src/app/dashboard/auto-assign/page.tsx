"use client";

import { useState, useMemo } from "react";
import * as React from "react";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Settings,
  Trash2,
  Users,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SourceConfig = {
  source: string;
  isEnabled: boolean;
  assignmentType: "SPECIFIC" | "ROUND_ROBIN" | "PERCENTAGE" | "TEAM";
  agents: Array<{
    userId: string;
    percentage?: number;
  }>;
  teamId?: string | null;
  campaignId?: string | null;
};

export default function AutoAssignPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sourceConfig, setSourceConfig] = useState<SourceConfig | null>(null);
  const [newSourceName, setNewSourceName] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  const utils = api.useUtils();
  const { data: assignmentRules } = api.webhook.getAssignmentRules.useQuery();
  const { data: users } = api.user.getAll.useQuery();
  const { data: teams } = api.team.getAll.useQuery();
  const { data: campaignsData } = api.campaign.getAll.useQuery({
    page: 1,
    limit: 100,
  });
  const campaigns = campaignsData?.campaigns;
  const { data: uniqueSources } = api.webhook.getUniqueSources.useQuery();

  const upsertAssignmentRule = api.webhook.upsertAssignmentRule.useMutation({
    onSuccess: () => {
      toast.success("Assignment configuration saved");
      utils.webhook.getAssignmentRules.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAssignmentRule = api.webhook.deleteAssignmentRule.useMutation({
    onSuccess: () => {
      toast.success("Assignment configuration deleted");
      utils.webhook.getAssignmentRules.invalidate();
    },
  });

  const toggleAssignmentRule = api.webhook.toggleAssignmentRule.useMutation({
    onSuccess: () => {
      utils.webhook.getAssignmentRules.invalidate();
    },
  });

  // Get configuration for a source from existing rules
  const getSourceConfig = (source: string): SourceConfig => {
    const rulesForSource =
      assignmentRules?.filter((r: any) => (r.source || "ALL") === source) || [];

    if (rulesForSource.length > 0) {
      const firstRule = rulesForSource[0];
      return {
        source,
        isEnabled: firstRule.isEnabled,
        assignmentType: firstRule.assignmentType || "SPECIFIC",
        agents: rulesForSource
          .filter((r: any) => r.assigneeId)
          .map((r: any) => ({
            userId: r.assigneeId,
            percentage: r.percentage,
          })),
        teamId: firstRule.teamId || null,
        campaignId: firstRule.campaignId,
      };
    }

    // Default config
    return {
      source,
      isEnabled: true,
      assignmentType: "SPECIFIC",
      agents: [],
      teamId: null,
      campaignId: null,
    };
  };

  const handleOpenSourceConfig = (source: string) => {
    setSelectedSource(source);
    setSourceConfig(getSourceConfig(source));
    setIsConfigDialogOpen(true);
  };

  const handleSaveSourceConfig = async () => {
    if (!sourceConfig || !selectedSource) return;

    try {
      // Delete existing rules for this source
      const existingRules =
        assignmentRules?.filter(
          (r: any) => (r.source || "ALL") === selectedSource,
        ) || [];

      for (const rule of existingRules) {
        await deleteAssignmentRule.mutateAsync({ id: rule.id });
      }

      // Create new rules based on config
      if (sourceConfig.assignmentType === "TEAM" && sourceConfig.teamId) {
        // Create a single rule for team assignment
        await upsertAssignmentRule.mutateAsync({
          assigneeId: null,
          teamId: sourceConfig.teamId,
          source: selectedSource === "ALL" ? null : selectedSource,
          campaignId: sourceConfig.campaignId,
          assignmentType: sourceConfig.assignmentType,
          percentage: undefined,
          rulePriority: 0,
          isEnabled: sourceConfig.isEnabled,
        });
      } else {
        // Create rules for individual agents
        for (const agent of sourceConfig.agents) {
          await upsertAssignmentRule.mutateAsync({
            assigneeId: agent.userId,
            teamId: null,
            source: selectedSource === "ALL" ? null : selectedSource,
            campaignId: sourceConfig.campaignId,
            assignmentType: sourceConfig.assignmentType,
            percentage: agent.percentage,
            rulePriority: 0,
            isEnabled: sourceConfig.isEnabled,
          });
        }
      }

      toast.success(`Configuration saved for ${selectedSource}`);
      setIsConfigDialogOpen(false);
      setSelectedSource(null);
      setSourceConfig(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    }
  };

  const handleAddSource = () => {
    if (!newSourceName.trim()) {
      toast.error("Please enter a source name");
      return;
    }

    setNewSourceName("");
    setIsAddingSource(false);
    handleOpenSourceConfig(newSourceName);
  };

  const allSources = useMemo(() => {
    const sources = new Set<string>();
    sources.add("ALL"); // Global catch-all
    uniqueSources?.forEach((s) => sources.add(s));
    return Array.from(sources);
  }, [uniqueSources]);

  // Get source stats
  const getSourceStats = (source: string) => {
    const rulesForSource =
      assignmentRules?.filter((r: any) => (r.source || "ALL") === source) || [];

    const isConfigured = rulesForSource.length > 0;
    const isEnabled = rulesForSource.some((r: any) => r.isEnabled);
    const assignmentType = rulesForSource[0]?.assignmentType || "SPECIFIC";
    const totalAssigned = rulesForSource.reduce(
      (sum: number, r: any) => sum + (r.assignmentCount || 0),
      0,
    );

    let agentCount = 0;
    let agents: any[] = [];
    let teamInfo = null;

    if (assignmentType === "TEAM" && rulesForSource[0]?.team) {
      const team = rulesForSource[0].team;
      teamInfo = {
        name: team.name,
        memberCount: team.members.length,
      };
      agentCount = team.members.length;
      agents = team.members.map((member: any) => ({
        name: member.name,
        percentage: null,
        assignmentCount: 0, // Team members share the count
      }));
    } else {
      agentCount = rulesForSource.length;
      agents = rulesForSource
        .filter((r: any) => r.assignee)
        .map((r: any) => ({
          name: r.assignee.name,
          percentage: r.percentage,
          assignmentCount: r.assignmentCount || 0,
        }));
    }

    return {
      isConfigured,
      isEnabled,
      agentCount,
      assignmentType,
      totalAssigned,
      agents,
      teamInfo,
    };
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Auto-Assignment Configuration
            </h2>
            <p className="text-muted-foreground mt-2">
              Configure automatic lead assignment per source. Click any source
              to set up assignment rules.
            </p>
          </div>
          <Button onClick={() => setIsAddingSource(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add Custom Source
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Lead Sources
            </CardTitle>
            <CardDescription>
              Click on any source to configure auto-assignment rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAddingSource && (
              <div className="bg-muted/50 mb-4 flex gap-2 rounded-lg border p-4">
                <Input
                  placeholder="Enter source name (e.g., Justdial, Facebook)"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSource();
                    if (e.key === "Escape") {
                      setIsAddingSource(false);
                      setNewSourceName("");
                    }
                  }}
                  autoFocus
                />
                <Button onClick={handleAddSource}>Add</Button>
                <Button
                  onClick={() => {
                    setIsAddingSource(false);
                    setNewSourceName("");
                  }}
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            )}

            {allSources.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead>Leads Assigned</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSources.map((source) => {
                    const stats = getSourceStats(source);

                    return (
                      <TableRow
                        key={source}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleOpenSourceConfig(source)}
                      >
                        <TableCell className="font-medium">
                          <Badge variant="secondary" className="text-sm">
                            {source}
                          </Badge>
                          {source === "ALL" && (
                            <span className="text-muted-foreground ml-2 text-xs">
                              (Default)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats.isConfigured ? (
                            stats.isEnabled ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )
                          ) : (
                            <Badge variant="outline">Not Configured</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats.isConfigured ? (
                            <span className="text-sm">
                              {stats.assignmentType === "ROUND_ROBIN" &&
                                "🔄 Round Robin"}
                              {stats.assignmentType === "PERCENTAGE" &&
                                "📊 Percentage"}
                              {stats.assignmentType === "SPECIFIC" &&
                                "🎯 Specific"}
                              {stats.assignmentType === "TEAM" && "👥 Team"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats.isConfigured ? (
                            <div className="space-y-1">
                              {stats.assignmentType === "TEAM" &&
                              stats.teamInfo ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="default" className="text-xs">
                                    👥 {stats.teamInfo.name}
                                  </Badge>
                                  <span className="text-muted-foreground text-xs">
                                    ({stats.teamInfo.memberCount} members)
                                  </span>
                                </div>
                              ) : (
                                stats.agents.map((agent, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <span className="font-medium">
                                      {agent.name}
                                    </span>
                                    {stats.assignmentType === "PERCENTAGE" && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {agent.percentage}%
                                      </Badge>
                                    )}
                                    {agent.assignmentCount > 0 && (
                                      <span className="text-muted-foreground text-xs">
                                        ({agent.assignmentCount} assigned)
                                      </span>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats.totalAssigned > 0 ? (
                            <span className="text-sm">
                              {stats.totalAssigned}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              0
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSourceConfig(source);
                            }}
                          >
                            Configure <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Settings className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium">No sources found</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Sources from your leads will appear here automatically. You
                  can also add custom sources.
                </p>
                <Button
                  onClick={() => setIsAddingSource(true)}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Source
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Dialog */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-x-hidden overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <span>Configure Auto-Assignment</span>
                <Badge variant="secondary" className="text-sm">
                  {selectedSource}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Set up how leads from this source should be automatically
                assigned to agents.
              </DialogDescription>
            </DialogHeader>

            {sourceConfig && (
              <div className="space-y-6 py-4">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-base">Enable Auto-Assignment</Label>
                    <p className="text-muted-foreground text-sm">
                      Automatically assign leads from this source
                    </p>
                  </div>
                  <Switch
                    checked={sourceConfig.isEnabled}
                    onCheckedChange={(checked) => {
                      setSourceConfig({ ...sourceConfig, isEnabled: checked });
                    }}
                  />
                </div>

                {/* Assignment Strategy */}
                <div className="space-y-2">
                  <Label>Assignment Strategy</Label>
                  <Select
                    value={sourceConfig.assignmentType}
                    onValueChange={(value: any) => {
                      setSourceConfig({
                        ...sourceConfig,
                        assignmentType: value,
                        agents:
                          value === "SPECIFIC"
                            ? sourceConfig.agents.slice(0, 1)
                            : value === "TEAM"
                              ? []
                              : sourceConfig.agents,
                        teamId: value === "TEAM" ? sourceConfig.teamId : null,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPECIFIC">
                        🎯 Specific Agent
                      </SelectItem>
                      <SelectItem value="ROUND_ROBIN">
                        🔄 Round Robin
                      </SelectItem>
                      <SelectItem value="PERCENTAGE">
                        📊 Percentage-Based
                      </SelectItem>
                      <SelectItem value="TEAM">👥 Team Distribution</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs break-words">
                    {sourceConfig.assignmentType === "ROUND_ROBIN" &&
                      "Leads will be distributed evenly among all agents in rotation"}
                    {sourceConfig.assignmentType === "PERCENTAGE" &&
                      "Set percentage for each agent (total must equal 100%)"}
                    {sourceConfig.assignmentType === "SPECIFIC" &&
                      "All leads will go to the selected agent"}
                    {sourceConfig.assignmentType === "TEAM" &&
                      "Leads will be distributed equally among all team members"}
                  </p>
                </div>

                {/* Campaign Assignment */}
                <div className="space-y-2">
                  <Label>Campaign (Optional)</Label>
                  <Select
                    value={sourceConfig.campaignId || "NONE"}
                    onValueChange={(value) => {
                      setSourceConfig({
                        ...sourceConfig,
                        campaignId: value === "NONE" ? null : value,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No Campaign</SelectItem>
                      {campaigns
                        ?.filter((c: any) => c.status !== "COMPLETED")
                        .map((campaign: any) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs break-words">
                    Leads will be automatically added to this campaign
                  </p>
                </div>

                {/* Team Selection (for TEAM assignment type) */}
                {sourceConfig.assignmentType === "TEAM" && (
                  <div className="space-y-2">
                    <Label>Select Team</Label>
                    <Select
                      value={sourceConfig.teamId || ""}
                      onValueChange={(value) => {
                        setSourceConfig({
                          ...sourceConfig,
                          teamId: value || null,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams && teams.length > 0 ? (
                          teams.map((team: any) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} ({team._count.members} members)
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-teams" disabled>
                            No teams available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs break-words">
                      Leads will be distributed equally among all team members
                    </p>
                  </div>
                )}

                {/* Agents Configuration */}
                {sourceConfig.assignmentType !== "TEAM" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Assigned Agents
                        {sourceConfig.assignmentType === "PERCENTAGE" &&
                          (() => {
                            const total = sourceConfig.agents.reduce(
                              (sum, a) => sum + (a.percentage || 0),
                              0,
                            );
                            return (
                              <Badge
                                variant={
                                  total === 100 ? "default" : "destructive"
                                }
                                className="ml-2"
                              >
                                {total}%
                              </Badge>
                            );
                          })()}
                      </Label>
                      {sourceConfig.assignmentType !== "SPECIFIC" && (
                        <Button
                          onClick={() => {
                            setSourceConfig({
                              ...sourceConfig,
                              agents: [
                                ...sourceConfig.agents,
                                { userId: "", percentage: 0 },
                              ],
                            });
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add Agent
                        </Button>
                      )}
                    </div>

                    {sourceConfig.agents.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed p-8 text-center">
                        <p className="text-muted-foreground mb-3 text-sm break-words">
                          No agents assigned. Add at least one agent to enable
                          auto-assignment.
                        </p>
                        <Button
                          onClick={() => {
                            setSourceConfig({
                              ...sourceConfig,
                              agents: [{ userId: "", percentage: 0 }],
                            });
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add First Agent
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sourceConfig.agents.map((agent, idx) => (
                          <div
                            key={idx}
                            className="bg-muted/30 flex flex-col items-stretch gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
                          >
                            <div className="min-w-0 flex-1">
                              <Select
                                value={agent.userId}
                                onValueChange={(userId) => {
                                  const newAgents = [...sourceConfig.agents];
                                  newAgents[idx] = { ...agent, userId };
                                  setSourceConfig({
                                    ...sourceConfig,
                                    agents: newAgents,
                                  });
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select agent" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users?.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      <span className="truncate">
                                        {user.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {sourceConfig.assignmentType === "PERCENTAGE" && (
                              <div className="flex w-full items-center gap-2 sm:w-auto">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={agent.percentage || ""}
                                  onChange={(e) => {
                                    const newAgents = [...sourceConfig.agents];
                                    newAgents[idx] = {
                                      ...agent,
                                      percentage: parseInt(e.target.value) || 0,
                                    };
                                    setSourceConfig({
                                      ...sourceConfig,
                                      agents: newAgents,
                                    });
                                  }}
                                  className="w-20"
                                />
                                <span className="text-muted-foreground text-sm">
                                  %
                                </span>
                              </div>
                            )}

                            <Button
                              onClick={() => {
                                const newAgents = sourceConfig.agents.filter(
                                  (_, i) => i !== idx,
                                );
                                setSourceConfig({
                                  ...sourceConfig,
                                  agents: newAgents,
                                });
                              }}
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {sourceConfig.assignmentType === "PERCENTAGE" &&
                      (() => {
                        const total = sourceConfig.agents.reduce(
                          (sum, a) => sum + (a.percentage || 0),
                          0,
                        );
                        if (total !== 100) {
                          return (
                            <div
                              className={`rounded-lg border p-3 text-sm break-words ${
                                total > 100
                                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50"
                                  : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/50"
                              }`}
                            >
                              {total < 100
                                ? `⚠ ${100 - total}% unassigned - Some leads may not be assigned`
                                : `⚠ Over-allocated by ${total - 100}% - Please adjust percentages`}
                            </div>
                          );
                        }
                        return (
                          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/50">
                            ✓ Perfect! 100% allocated
                          </div>
                        );
                      })()}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsConfigDialogOpen(false);
                  setSelectedSource(null);
                  setSourceConfig(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSourceConfig}
                disabled={
                  upsertAssignmentRule.isPending ||
                  !sourceConfig?.agents.length ||
                  sourceConfig.agents.some((a) => !a.userId)
                }
              >
                {upsertAssignmentRule.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
