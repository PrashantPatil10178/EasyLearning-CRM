"use client";

import { useState } from "react";
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
import { Loader2, Plus, Pencil, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AutoAssignPage() {
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const utils = api.useUtils();
  const { data: assignmentRules } = api.webhook.getAssignmentRules.useQuery();
  const { data: users } = api.user.getAll.useQuery();
  const { data: campaignsData } = api.campaign.getAll.useQuery({
    page: 1,
    limit: 100,
  });
  const campaigns = campaignsData?.campaigns;

  const upsertAssignmentRule = api.webhook.upsertAssignmentRule.useMutation({
    onSuccess: () => {
      toast.success("Assignment rule saved");
      setIsAssignmentDialogOpen(false);
      setEditingRule(null);
      utils.webhook.getAssignmentRules.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAssignmentRule = api.webhook.deleteAssignmentRule.useMutation({
    onSuccess: () => {
      toast.success("Assignment rule deleted");
      utils.webhook.getAssignmentRules.invalidate();
    },
  });

  const toggleAssignmentRule = api.webhook.toggleAssignmentRule.useMutation({
    onSuccess: () => {
      utils.webhook.getAssignmentRules.invalidate();
    },
  });

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Auto-Assignment Rules
            </h2>
            <p className="text-muted-foreground mt-2">
              Configure automatic lead assignment with Round Robin, Percentage,
              or Direct strategies based on source and campaign
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingRule(null);
              setIsAssignmentDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Rule
          </Button>
        </div>

        {/* Assignment Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings className="h-5 w-5" />
              Assignment Rules
            </CardTitle>
            <CardDescription>
              Rules are applied in priority order. Configure user assignment and
              campaign routing based on lead source.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {assignmentRules && assignmentRules.length > 0 ? (
              (() => {
                // Group rules by source
                const groupedRules = assignmentRules.reduce(
                  (acc: any, rule: any) => {
                    const sourceKey = rule.source || "All Sources";
                    if (!acc[sourceKey]) acc[sourceKey] = [];
                    acc[sourceKey].push(rule);
                    return acc;
                  },
                  {},
                );

                return (
                  <div className="space-y-6">
                    {Object.entries(groupedRules).map(
                      ([source, rules]: [string, any]) => {
                        // Calculate percentage totals for this source
                        const percentageRules = rules.filter(
                          (r: any) => r.assignmentType === "PERCENTAGE",
                        );
                        const totalPercentage = percentageRules.reduce(
                          (sum: number, r: any) => sum + (r.percentage || 0),
                          0,
                        );
                        const remainingPercentage = 100 - totalPercentage;

                        return (
                          <div key={source} className="space-y-3">
                            {/* Source Header with Stats */}
                            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="secondary"
                                  className="px-3 py-1 text-sm"
                                >
                                  {source}
                                </Badge>
                                <span className="text-muted-foreground text-sm">
                                  {rules.length} rule
                                  {rules.length > 1 ? "s" : ""}
                                </span>
                              </div>
                              {percentageRules.length > 0 && (
                                <div className="flex items-center gap-2">
                                  {totalPercentage === 100 ? (
                                    <Badge
                                      variant="outline"
                                      className="border-green-200 bg-green-50 text-green-700"
                                    >
                                      ✓ 100% Allocated
                                    </Badge>
                                  ) : totalPercentage < 100 ? (
                                    <Badge
                                      variant="outline"
                                      className="border-yellow-200 bg-yellow-50 text-yellow-700"
                                    >
                                      ⚠ {remainingPercentage}% Unassigned
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="border-red-200 bg-red-50 text-red-700"
                                    >
                                      ⚠ Over-allocated by{" "}
                                      {totalPercentage - 100}%
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Rules for this source */}
                            <div className="ml-4 space-y-3">
                              {rules.map((rule: any) => (
                                <div
                                  key={rule.id}
                                  className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950"
                                >
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={rule.isEnabled}
                                      onCheckedChange={(checked) =>
                                        toggleAssignmentRule.mutate({
                                          id: rule.id,
                                          isEnabled: checked,
                                        })
                                      }
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {rule.assignee.name}
                                        </span>
                                        {rule.assignmentType ===
                                          "ROUND_ROBIN" && (
                                          <Badge
                                            variant="outline"
                                            className="border-blue-200 bg-blue-50 text-blue-700"
                                          >
                                            🔄 Round Robin
                                          </Badge>
                                        )}
                                        {rule.assignmentType ===
                                          "PERCENTAGE" && (
                                          <Badge
                                            variant="outline"
                                            className="border-green-200 bg-green-50 text-green-700"
                                          >
                                            📊 {rule.percentage}%
                                          </Badge>
                                        )}
                                        {(!rule.assignmentType ||
                                          rule.assignmentType ===
                                            "SPECIFIC") && (
                                          <Badge
                                            variant="outline"
                                            className="border-purple-200 bg-purple-50 text-purple-700"
                                          >
                                            🎯 Direct
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-muted-foreground mt-1 text-sm">
                                        {rule.assignmentCount > 0 &&
                                          `${rule.assignmentCount} leads assigned`}
                                        {rule.campaign && (
                                          <Badge
                                            variant="secondary"
                                            className="ml-2 text-xs"
                                          >
                                            → {rule.campaign.name}
                                          </Badge>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (
                                        confirm("Delete this assignment rule?")
                                      ) {
                                        deleteAssignmentRule.mutate({
                                          id: rule.id,
                                        });
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Settings className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium">
                  No assignment rules configured
                </h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Add a rule to automatically assign leads to agents based on
                  source and campaign with different strategies.
                </p>
                <Button
                  onClick={() => {
                    setEditingRule(null);
                    setIsAssignmentDialogOpen(true);
                  }}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Rule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Rule Dialog */}
        <Dialog
          open={isAssignmentDialogOpen}
          onOpenChange={setIsAssignmentDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Auto-Assignment Rule</DialogTitle>
              <DialogDescription>
                Configure automatic lead assignment with Round Robin,
                Percentage-based, or direct assignment strategies.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="assignmentType">Assignment Strategy</Label>
                <Select
                  onValueChange={(value) => {
                    setEditingRule((prev: any) => ({
                      ...prev,
                      assignmentType: value,
                    }));
                  }}
                  defaultValue="SPECIFIC"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPECIFIC">
                      Specific Agent - Always assign to this agent
                    </SelectItem>
                    <SelectItem value="ROUND_ROBIN">
                      Round Robin - Distribute evenly in rotation
                    </SelectItem>
                    <SelectItem value="PERCENTAGE">
                      Percentage - Assign based on percentage
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  {editingRule?.assignmentType === "ROUND_ROBIN" &&
                    "Leads will be distributed evenly among all Round Robin agents"}
                  {editingRule?.assignmentType === "PERCENTAGE" &&
                    "Set percentage for this agent (total should equal 100%)"}
                  {(!editingRule?.assignmentType ||
                    editingRule?.assignmentType === "SPECIFIC") &&
                    "All matching leads will go to this agent"}
                </p>
              </div>

              {editingRule?.assignmentType === "PERCENTAGE" && (
                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentage</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    onChange={(e) => {
                      const newPercentage = parseInt(e.target.value) || 0;
                      setEditingRule((prev: any) => ({
                        ...prev,
                        percentage: newPercentage,
                      }));
                    }}
                  />
                  {(() => {
                    // Calculate current allocation for selected source
                    const selectedSource = editingRule?.source || "All Sources";
                    const existingRulesForSource =
                      assignmentRules?.filter(
                        (r: any) =>
                          r.assignmentType === "PERCENTAGE" &&
                          (r.source || "All Sources") === selectedSource,
                      ) || [];

                    const currentTotal = existingRulesForSource.reduce(
                      (sum: number, r: any) => sum + (r.percentage || 0),
                      0,
                    );
                    const newTotal =
                      currentTotal + (editingRule?.percentage || 0);
                    const remaining = 100 - newTotal;

                    return (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-800 dark:bg-blue-950/50">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Current allocation for{" "}
                            <strong>{selectedSource}</strong>:
                          </span>
                          <span className="font-semibold">{currentTotal}%</span>
                        </div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-muted-foreground">
                            After adding this rule:
                          </span>
                          <span
                            className={`font-semibold ${
                              newTotal === 100
                                ? "text-green-600"
                                : newTotal < 100
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {newTotal}%
                          </span>
                        </div>
                        {remaining > 0 && (
                          <div className="text-yellow-700">
                            ⚠ {remaining}% will remain unassigned
                          </div>
                        )}
                        {remaining < 0 && (
                          <div className="text-red-700">
                            ⚠ Over-allocated by {Math.abs(remaining)}%
                          </div>
                        )}
                        {remaining === 0 && (
                          <div className="text-green-700">
                            ✓ 100% allocation complete
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="assignee">Assign To Agent</Label>
                <Select
                  onValueChange={(value) => {
                    setEditingRule((prev: any) => ({
                      ...prev,
                      assigneeId: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Lead Source (Optional)</Label>
                <div className="space-y-2">
                  <Select
                    onValueChange={(value) => {
                      if (value === "CUSTOM") {
                        setEditingRule((prev: any) => ({
                          ...prev,
                          sourceType: "custom",
                          source: "",
                        }));
                      } else {
                        setEditingRule((prev: any) => ({
                          ...prev,
                          sourceType: "preset",
                          source: value === "ALL" ? null : value,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Sources</SelectItem>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="FACEBOOK">Facebook</SelectItem>
                      <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                      <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                      <SelectItem value="REFERRAL">Referral</SelectItem>
                      <SelectItem value="WEBHOOK">Webhook</SelectItem>
                      <SelectItem value="PHONE_INQUIRY">Phone</SelectItem>
                      <SelectItem value="EMAIL_CAMPAIGN">Email</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="WALK_IN">Walk-in</SelectItem>
                      <SelectItem value="CUSTOM">
                        🎨 Custom Source...
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {editingRule?.sourceType === "custom" && (
                    <Input
                      placeholder="Enter custom source name (e.g., 'Facebook Lead Ad', 'Justdial')"
                      onChange={(e) => {
                        setEditingRule((prev: any) => ({
                          ...prev,
                          source: e.target.value,
                        }));
                      }}
                    />
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Percentage allocation is calculated per source. Select the
                  source first to see current allocation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Assign to Campaign (Optional)</Label>
                <Select
                  onValueChange={(value) => {
                    setEditingRule((prev: any) => ({
                      ...prev,
                      campaignId: value === "NONE" ? null : value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Campaign</SelectItem>
                    {campaigns
                      ?.filter((c: any) => c.status !== "COMPLETED")
                      .map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name} ({campaign.status})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Leads matching this source will be automatically added to the
                  selected campaign
                </p>
              </div>

              {editingRule?.assignmentType !== "PERCENTAGE" && (
                <div className="space-y-2">
                  <Label htmlFor="priority">Rule Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    placeholder="0"
                    defaultValue={0}
                    onChange={(e) => {
                      setEditingRule((prev: any) => ({
                        ...prev,
                        rulePriority: parseInt(e.target.value) || 0,
                      }));
                    }}
                  />
                  <p className="text-muted-foreground text-xs">
                    Lower = higher priority. Used when multiple{" "}
                    {editingRule?.assignmentType || "SPECIFIC"} rules match.
                  </p>
                </div>
              )}

              <Separator />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAssignmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!editingRule?.assigneeId) {
                      toast.error("Please select an agent");
                      return;
                    }
                    if (
                      editingRule?.assignmentType === "PERCENTAGE" &&
                      (!editingRule?.percentage || editingRule.percentage <= 0)
                    ) {
                      toast.error("Please enter a valid percentage (1-100)");
                      return;
                    }
                    upsertAssignmentRule.mutate({
                      assigneeId: editingRule.assigneeId,
                      source: editingRule.source,
                      campaignId: editingRule.campaignId,
                      assignmentType: editingRule.assignmentType || "SPECIFIC",
                      percentage: editingRule.percentage,
                      rulePriority: editingRule.rulePriority || 0,
                      isEnabled: true,
                    });
                  }}
                  disabled={upsertAssignmentRule.isPending}
                >
                  {upsertAssignmentRule.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Rule
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
