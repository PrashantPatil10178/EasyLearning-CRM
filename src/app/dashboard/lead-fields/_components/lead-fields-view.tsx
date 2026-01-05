"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type Stage = "INITIAL" | "ACTIVE" | "CLOSED";

// Predefined color palette for statuses
const PREDEFINED_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Pink", value: "#EC4899" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Gray", value: "#6B7280" },
  { name: "Emerald", value: "#22C55E" },
];

export function LeadFieldsView() {
  const [isAddStatusOpen, setIsAddStatusOpen] = useState(false);
  const [selectedStageForAdd, setSelectedStageForAdd] =
    useState<Stage>("ACTIVE");
  const [isAddReasonOpen, setIsAddReasonOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [editingReason, setEditingReason] = useState<any>(null);
  const [expandedStages, setExpandedStages] = useState<Set<Stage>>(
    new Set(["INITIAL", "ACTIVE", "CLOSED"]),
  );

  const { data: statusesByStage, refetch: refetchStatuses } =
    api.leadStatus.getByStage.useQuery();
  const { data: lostReasons, refetch: refetchReasons } =
    api.leadStatus.getLostReasons.useQuery();

  const createStatus = api.leadStatus.create.useMutation({
    onSuccess: () => {
      toast.success("Status created successfully");
      refetchStatuses();
      setIsAddStatusOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatus = api.leadStatus.update.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      refetchStatuses();
      setEditingStatus(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteStatus = api.leadStatus.delete.useMutation({
    onSuccess: () => {
      toast.success("Status deleted successfully");
      refetchStatuses();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createLostReason = api.leadStatus.createLostReason.useMutation({
    onSuccess: () => {
      toast.success("Reason created successfully");
      refetchReasons();
      setIsAddReasonOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateLostReason = api.leadStatus.updateLostReason.useMutation({
    onSuccess: () => {
      toast.success("Reason updated successfully");
      refetchReasons();
      setEditingReason(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteLostReason = api.leadStatus.deleteLostReason.useMutation({
    onSuccess: () => {
      toast.success("Reason deleted successfully");
      refetchReasons();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleStage = (stage: Stage) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case "INITIAL":
        return "#E5E7EB";
      case "ACTIVE":
        return "#BBF7D0";
      case "CLOSED":
        return "#FECACA";
    }
  };

  const getStageLabel = (stage: Stage) => {
    switch (stage) {
      case "INITIAL":
        return "Initial stage";
      case "ACTIVE":
        return "Active stage";
      case "CLOSED":
        return "Closed stage";
    }
  };

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ fontWeight: 700 }}
          >
            Lead Status Fields
          </h2>
          <p className="text-muted-foreground mt-1" style={{ fontWeight: 500 }}>
            Customize your lead status pipeline
          </p>
        </div>
      </div>

      {/* Status Stages */}
      <div className="grid gap-4 md:grid-cols-3">
        {(["INITIAL", "ACTIVE", "CLOSED"] as Stage[]).map((stage) => {
          const statuses = statusesByStage?.[stage] || [];
          const isExpanded = expandedStages.has(stage);

          return (
            <Card
              key={stage}
              className="lurni-card"
              style={{ backgroundColor: `${getStageColor(stage)}20` }}
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleStage(stage)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="flex items-center gap-2 text-lg"
                    style={{ fontWeight: 700 }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {getStageLabel(stage)}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStageForAdd(stage);
                      setIsAddStatusOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-2">
                  {statuses.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      No statuses yet
                    </p>
                  ) : (
                    statuses.map((status) => (
                      <div
                        key={status.id}
                        className="flex items-center gap-2 rounded-lg p-3"
                        style={{
                          backgroundColor: status.color || "#F3F4F6",
                        }}
                      >
                        <GripVertical className="text-muted-foreground h-4 w-4" />
                        <span className="flex-1" style={{ fontWeight: 500 }}>
                          {status.name}
                        </span>
                        {status.isDefault && (
                          <Badge
                            variant="secondary"
                            style={{ fontSize: "10px" }}
                          >
                            Default
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingStatus(status)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete "${status.name}"?`,
                              )
                            ) {
                              deleteStatus.mutate({ id: status.id });
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Lost Lead Reasons */}
      <Card className="lurni-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{ fontWeight: 700 }}>
                Lost Lead Reasons
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Define reasons why leads are marked as "Lost". This helps track
                common objections and improve your sales process.
              </p>
            </div>
            <Button onClick={() => setIsAddReasonOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {lostReasons?.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No reasons yet
              </p>
            ) : (
              lostReasons?.map((reason) => (
                <div
                  key={reason.id}
                  className="bg-muted flex items-center gap-2 rounded-lg p-3"
                >
                  <GripVertical className="text-muted-foreground h-4 w-4" />
                  <span className="flex-1" style={{ fontWeight: 500 }}>
                    {reason.name}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditingReason(reason)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${reason.name}"?`,
                        )
                      ) {
                        deleteLostReason.mutate({ id: reason.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Status Dialog */}
      <Dialog
        open={isAddStatusOpen || !!editingStatus}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddStatusOpen(false);
            setEditingStatus(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? "Edit Status" : "Add Status"}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? "Update the status details"
                : "Create a new lead status"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get("name") as string,
                stage: (formData.get("stage") as Stage) || "ACTIVE",
                color: formData.get("color") as string,
                isDefault: formData.get("isDefault") === "on",
              };

              if (editingStatus) {
                updateStatus.mutate({
                  id: editingStatus.id,
                  ...data,
                });
              } else {
                createStatus.mutate(data);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Status Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingStatus?.name}
                placeholder="e.g., Interested"
                required
              />
            </div>

            {!editingStatus && (
              <div className="space-y-2">
                <Label htmlFor="status-stage">Stage</Label>
                <Select name="stage" defaultValue={selectedStageForAdd}>
                  <SelectTrigger id="status-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INITIAL">Initial</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                name="color"
                defaultValue={editingStatus?.color || "#3B82F6"}
              >
                <SelectTrigger id="color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                name="isDefault"
                defaultChecked={editingStatus?.isDefault}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default for new leads
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddStatusOpen(false);
                  setEditingStatus(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStatus.isPending || updateStatus.isPending}
              >
                {(createStatus.isPending || updateStatus.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingStatus ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Lost Reason Dialog */}
      <Dialog
        open={isAddReasonOpen || !!editingReason}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddReasonOpen(false);
            setEditingReason(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReason ? "Edit Reason" : "Add Reason"}
            </DialogTitle>
            <DialogDescription>
              {editingReason
                ? "Update the reason for lost leads"
                : "Create a new reason for lost leads"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get("name") as string,
              };

              if (editingReason) {
                updateLostReason.mutate({
                  id: editingReason.id,
                  ...data,
                });
              } else {
                createLostReason.mutate(data);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="reason-name">Reason</Label>
              <Input
                id="reason-name"
                name="name"
                defaultValue={editingReason?.name}
                placeholder="e.g., Budget Issues"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddReasonOpen(false);
                  setEditingReason(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createLostReason.isPending || updateLostReason.isPending
                }
              >
                {(createLostReason.isPending || updateLostReason.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingReason ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
