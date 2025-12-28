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
import {
  Loader2,
  Plus,
  Pencil,
  MessageCircle,
  Zap,
  Settings,
  Send,
  AlertCircle,
  CheckCircle2,
  Copy,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_STATUS_HIERARCHY,
  ALL_LEAD_STATUSES,
  statusStyles,
} from "@/lib/lead-status";

// Common template parameters for AISensy
const TEMPLATE_PARAMS = [
  { key: "{{FirstName}}", description: "Lead's first name" },
  { key: "{{Phone}}", description: "Lead's phone number" },
  { key: "{{Email}}", description: "Lead's email" },
  { key: "{{Source}}", description: "Lead source" },
  { key: "{{CourseInterested}}", description: "Course interested in" },
  { key: "{{FeedbackLink}}", description: "Feedback form URL" },
  { key: "{{Amount}}", description: "Amount/Price" },
  { key: "{{Date}}", description: "Date" },
];

export default function WhatsAppTriggersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const utils = api.useUtils();
  const { data: triggers, isLoading } = api.whatsapp.getTriggers.useQuery();

  // Check if AISensy integration is active
  const { data: aisensyIntegration, isLoading: isCheckingIntegration } =
    api.integration.get.useQuery({ provider: "AISENSY" });

  // Check if AISensy is enabled AND has API key configured
  const isAISensyActive = React.useMemo(() => {
    if (!aisensyIntegration?.isEnabled) return false;

    try {
      const config = JSON.parse(aisensyIntegration.config || "{}");
      // Check if apiKey exists and is not empty (even if masked)
      return !!config.apiKey && config.apiKey.length > 0;
    } catch (e) {
      return false;
    }
  }, [aisensyIntegration]);

  const upsertTrigger = api.whatsapp.upsertTrigger.useMutation({
    onSuccess: () => {
      toast.success(editingTrigger ? "Trigger updated" : "Trigger created");
      setIsDialogOpen(false);
      setEditingTrigger(null);
      setSelectedStatus("");
      utils.whatsapp.getTriggers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddNew = () => {
    setEditingTrigger(null);
    setSelectedStatus("");
    setIsDialogOpen(true);
  };

  const handleEdit = (trigger: any) => {
    setEditingTrigger(trigger);
    setSelectedStatus(trigger.status);
    setIsDialogOpen(true);
  };

  // Create demo trigger for CONVERTED status
  const handleCreateDemoTrigger = () => {
    upsertTrigger.mutate({
      status: "CONVERTED",
      isEnabled: true,
      campaignName: "Congratulations on Enrollment",
      source: "EasyLearning CRM",
      templateParamsJson: JSON.stringify([
        "{{FirstName}}",
        "{{CourseInterested}}",
      ]),
      paramsFallbackJson: JSON.stringify({
        FirstName: "Student",
        CourseInterested: "our program",
      }),
    });
  };

  const handleToggle = (trigger: any) => {
    upsertTrigger.mutate({
      status: trigger.status,
      isEnabled: !trigger.isEnabled,
      campaignName: trigger.campaignName,
      source: trigger.source,
      templateParamsJson: trigger.templateParamsJson,
      paramsFallbackJson: trigger.paramsFallbackJson,
    });
  };

  const handleSave = () => {
    if (!selectedStatus) {
      toast.error("Please select a lead status");
      return;
    }

    const campaignName = (
      document.getElementById("campaignName") as HTMLInputElement
    )?.value;
    const source =
      (document.getElementById("source") as HTMLInputElement)?.value ||
      "EasyLearning CRM";
    const templateParams =
      (document.getElementById("templateParams") as HTMLTextAreaElement)
        ?.value || "[]";
    const paramsFallback =
      (document.getElementById("paramsFallback") as HTMLTextAreaElement)
        ?.value || "{}";

    if (!campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }

    // Validate JSON
    try {
      JSON.parse(templateParams);
      JSON.parse(paramsFallback);
    } catch (e) {
      toast.error("Invalid JSON format in parameters");
      return;
    }

    upsertTrigger.mutate({
      status: selectedStatus,
      isEnabled: editingTrigger?.isEnabled ?? true,
      campaignName,
      source,
      templateParamsJson: templateParams,
      paramsFallbackJson: paramsFallback,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Group triggers by enabled status
  const enabledTriggers = triggers?.filter((t) => t.isEnabled) || [];
  const disabledTriggers = triggers?.filter((t) => !t.isEnabled) || [];

  // Get configured statuses
  const configuredStatuses = new Set(triggers?.map((t) => t.status) || []);
  const availableStatuses = ALL_LEAD_STATUSES.filter(
    (s) =>
      !configuredStatuses.has(s.value) ||
      (editingTrigger && s.value === editingTrigger.status),
  );

  const getStatusInfo = (status: string) => {
    return (
      ALL_LEAD_STATUSES.find((s) => s.value === status) || {
        label: status,
        value: status,
        color: "gray",
      }
    );
  };

  // Show setup message if AISensy is not configured
  if (isCheckingIntegration) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!isAISensyActive) {
    return (
      <PageContainer>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="max-w-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <AlertCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="mb-3 text-2xl font-bold">
                AISensy Integration Required
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                WhatsApp Triggers require AISensy integration to be configured
                and active. Please set up your AISensy credentials first.
              </p>
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                  <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                    📋 Setup Steps:
                  </h3>
                  <ol className="space-y-2 text-left text-sm text-blue-800 dark:text-blue-200">
                    <li>
                      1. Go to <strong>Integrations</strong> page
                    </li>
                    <li>
                      2. Click on <strong>AISensy</strong> card
                    </li>
                    <li>3. Enable integration and add your API key</li>
                    <li>4. Save settings</li>
                    <li>5. Return here to configure WhatsApp triggers</li>
                  </ol>
                </div>
                <Button size="lg" asChild>
                  <a href="/dashboard/integrations">
                    <Settings className="mr-2 h-5 w-5" />
                    Go to Integrations
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              WhatsApp Triggers
            </h2>
            <p className="text-muted-foreground mt-2">
              Automatically send WhatsApp messages via AISensy when lead status
              changes
            </p>
          </div>
          <div className="flex gap-2">
            {triggers?.length === 0 && (
              <Button
                onClick={handleCreateDemoTrigger}
                variant="outline"
                size="lg"
              >
                <Zap className="mr-2 h-4 w-4" />
                Create Demo Trigger
              </Button>
            )}
            <Button onClick={handleAddNew} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Trigger
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Total Triggers
                  </p>
                  <p className="text-2xl font-bold">{triggers?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Active</p>
                  <p className="text-2xl font-bold">{enabledTriggers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Inactive</p>
                  <p className="text-2xl font-bold">
                    {disabledTriggers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Available</p>
                  <p className="text-2xl font-bold">
                    {availableStatuses.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Triggers */}
        {enabledTriggers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Active Triggers
              </CardTitle>
              <CardDescription>
                These triggers are currently active and will send WhatsApp
                messages when triggered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enabledTriggers.map((trigger) => {
                  const statusInfo = getStatusInfo(trigger.status);
                  let params = [];
                  try {
                    params = JSON.parse(trigger.templateParamsJson || "[]");
                  } catch (e) {}

                  return (
                    <div
                      key={trigger.id}
                      className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                          <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                statusStyles[
                                  trigger.status as keyof typeof statusStyles
                                ]
                              }
                            >
                              {statusInfo.label}
                            </Badge>
                            <span className="text-muted-foreground text-sm">
                              →
                            </span>
                            <span className="font-medium">
                              {trigger.campaignName}
                            </span>
                          </div>
                          {params.length > 0 && (
                            <p className="text-muted-foreground text-xs">
                              Parameters: {params.join(", ")}
                            </p>
                          )}
                          <p className="text-muted-foreground text-xs">
                            Source: {trigger.source || "EasyLearning CRM"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={trigger.isEnabled}
                          onCheckedChange={() => handleToggle(trigger)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(trigger)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inactive Triggers */}
        {disabledTriggers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gray-600" />
                Inactive Triggers
              </CardTitle>
              <CardDescription>
                These triggers are configured but not active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {disabledTriggers.map((trigger) => {
                  const statusInfo = getStatusInfo(trigger.status);
                  let params = [];
                  try {
                    params = JSON.parse(trigger.templateParamsJson || "[]");
                  } catch (e) {}

                  return (
                    <div
                      key={trigger.id}
                      className="flex items-center justify-between rounded-lg border bg-gray-50 p-4 dark:bg-gray-900/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                          <MessageCircle className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="space-y-1 opacity-60">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                statusStyles[
                                  trigger.status as keyof typeof statusStyles
                                ]
                              }
                            >
                              {statusInfo.label}
                            </Badge>
                            <span className="text-muted-foreground text-sm">
                              →
                            </span>
                            <span className="font-medium">
                              {trigger.campaignName}
                            </span>
                          </div>
                          {params.length > 0 && (
                            <p className="text-muted-foreground text-xs">
                              Parameters: {params.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={trigger.isEnabled}
                          onCheckedChange={() => handleToggle(trigger)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(trigger)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && triggers?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <MessageCircle className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold">No triggers configured</h3>
              <p className="text-muted-foreground mt-2 max-w-md text-center">
                Start automating your WhatsApp communications by creating your
                first trigger
              </p>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleCreateDemoTrigger}
                  variant="outline"
                  size="lg"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Create Demo Trigger (CONVERTED)
                </Button>
                <Button onClick={handleAddNew} size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Custom Trigger
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card - Matching PHP Reference */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  How WhatsApp Triggers Work
                </h3>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>
                    • Triggers fire automatically when a lead's status changes
                    (e.g., FOLLOW_UP_DONE → Get Feedback)
                  </li>
                  <li>
                    • Each trigger is linked to a specific AISensy campaign name
                  </li>
                  <li>
                    • Template parameters are dynamically replaced with lead
                    data (FirstName, Phone, etc.)
                  </li>
                  <li>
                    • Phone numbers are normalized (10 digits → add 91 prefix
                    for India)
                  </li>
                  <li>
                    • You can enable/disable triggers anytime without deleting
                    them
                  </li>
                  <li>
                    • Activity logs track all WhatsApp messages sent via
                    triggers
                  </li>
                </ul>
                <div className="mt-3 rounded-md border-l-4 border-green-500 bg-white/50 p-3 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    ✅ Demo Example: When status changes to{" "}
                    <strong>CONVERTED</strong> →
                  </p>
                  <p className="mt-1 text-xs text-green-800 dark:text-green-200">
                    Sends: "Congratulations [Name] on enrolling in [Course]!"
                    via AISensy
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog - SIMPLIFIED */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingTrigger ? "Edit" : "Create"} WhatsApp Trigger
              </DialogTitle>
              <DialogDescription className="text-base">
                Send automatic WhatsApp when lead status changes - it's easy! 🚀
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* STEP 1: Pick Status */}
              <div className="space-y-3 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                    1
                  </div>
                  <Label className="text-lg font-semibold">
                    When should WhatsApp be sent?
                  </Label>
                </div>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  disabled={!!editingTrigger}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="👉 Pick a lead status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUS_HIERARCHY.map((category) => (
                      <div key={category.value}>
                        <div className="text-muted-foreground px-2 py-1.5 text-sm font-semibold">
                          {category.label}
                        </div>
                        {category.statuses
                          .filter(
                            (status) =>
                              !configuredStatuses.has(status.value) ||
                              (editingTrigger &&
                                status.value === editingTrigger.status),
                          )
                          .map((status) => (
                            <SelectItem
                              key={status.value}
                              value={status.value}
                              className="py-3 text-base"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    statusStyles[
                                      status.value as keyof typeof statusStyles
                                    ]
                                  }
                                >
                                  {status.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <p className="pl-10 text-sm text-blue-700 dark:text-blue-300">
                  💡 Choose when to trigger: e.g., when lead becomes "Converted"
                </p>
              </div>

              {/* STEP 2: Campaign Name */}
              <div className="space-y-3 rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 font-bold text-white">
                    2
                  </div>
                  <Label className="text-lg font-semibold">
                    What message template to send?
                  </Label>
                </div>
                <Input
                  id="campaignName"
                  placeholder="Type your AISensy campaign name here..."
                  defaultValue={editingTrigger?.campaignName || ""}
                  className="h-12 text-base"
                />
                <div className="rounded-md bg-white/50 p-3 pl-10 dark:bg-green-900/20">
                  <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">
                    📝 Quick Examples:
                  </p>
                  <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                    <div
                      className="flex cursor-pointer items-center gap-2 hover:underline"
                      onClick={() => {
                        const input = document.getElementById(
                          "campaignName",
                        ) as HTMLInputElement;
                        if (input)
                          input.value = "Congratulations on Enrollment";
                      }}
                    >
                      • "Congratulations on Enrollment"{" "}
                      <Copy className="h-3 w-3" />
                    </div>
                    <div
                      className="flex cursor-pointer items-center gap-2 hover:underline"
                      onClick={() => {
                        const input = document.getElementById(
                          "campaignName",
                        ) as HTMLInputElement;
                        if (input) input.value = "Get Feedback";
                      }}
                    >
                      • "Get Feedback" <Copy className="h-3 w-3" />
                    </div>
                    <div
                      className="flex cursor-pointer items-center gap-2 hover:underline"
                      onClick={() => {
                        const input = document.getElementById(
                          "campaignName",
                        ) as HTMLInputElement;
                        if (input) input.value = "Follow Up Reminder";
                      }}
                    >
                      • "Follow Up Reminder" <Copy className="h-3 w-3" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-green-600 italic dark:text-green-400">
                    ⚠️ Must match EXACTLY with your campaign name in AISensy
                    dashboard
                  </p>
                </div>
              </div>

              {/* STEP 3: Add Lead Info (Simplified) */}
              <div className="space-y-3 rounded-lg border-2 border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
                    3
                  </div>
                  <Label className="text-lg font-semibold">
                    Personalize message (optional)
                  </Label>
                </div>

                <div className="space-y-3 rounded-md bg-white/50 p-4 pl-10 dark:bg-purple-900/20">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    🎨 Click to add dynamic fields to your message:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATE_PARAMS.slice(0, 6).map((param) => (
                      <button
                        type="button"
                        key={param.key}
                        className="flex items-center gap-2 rounded-lg border border-purple-300 bg-white p-2 text-left text-sm transition-colors hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-900/50 dark:hover:bg-purple-800/50"
                        onClick={() => {
                          const textarea = document.getElementById(
                            "templateParams",
                          ) as HTMLTextAreaElement;
                          if (textarea) {
                            try {
                              const current = JSON.parse(
                                textarea.value || "[]",
                              );
                              current.push(param.key);
                              textarea.value = JSON.stringify(current, null, 2);
                            } catch (e) {
                              textarea.value = JSON.stringify(
                                [param.key],
                                null,
                                2,
                              );
                            }
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="font-medium text-purple-900 dark:text-purple-100">
                            {param.key.replace(/{{|}}/g, "")}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            {param.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <Textarea
                    id="templateParams"
                    rows={3}
                    placeholder='["{{FirstName}}"] - Add fields above or type here'
                    defaultValue={
                      editingTrigger?.templateParamsJson || '["{{FirstName}}"]'
                    }
                    className="mt-3 font-mono text-sm"
                  />

                  <p className="text-xs text-purple-600 italic dark:text-purple-400">
                    💡 These will be replaced with actual lead data when sending
                  </p>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-sm transition-colors"
              >
                <Settings className="h-4 w-4" />
                {showAdvanced ? "Hide" : "Show"} Advanced Settings
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                />
              </button>

              {/* Advanced Settings */}
              {showAdvanced && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                  {/* Source */}
                  <div className="space-y-2">
                    <Label htmlFor="source" className="text-sm">
                      Source Name
                    </Label>
                    <Input
                      id="source"
                      placeholder="EasyLearning CRM"
                      defaultValue={
                        editingTrigger?.source || "EasyLearning CRM"
                      }
                      className="text-sm"
                    />
                    <p className="text-muted-foreground text-xs">
                      For tracking in AISensy reports
                    </p>
                  </div>

                  {/* Fallback Parameters */}
                  <div className="space-y-2">
                    <Label htmlFor="paramsFallback" className="text-sm">
                      Fallback Values
                    </Label>
                    <Textarea
                      id="paramsFallback"
                      rows={3}
                      placeholder='{"FirstName": "User", "Email": "N/A"}'
                      defaultValue={
                        editingTrigger?.paramsFallbackJson ||
                        '{"FirstName": "User"}'
                      }
                      className="font-mono text-xs"
                    />
                    <p className="text-muted-foreground text-xs">
                      Default values if lead data is missing
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Preview */}
              {selectedStatus && (
                <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/50">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-orange-900 dark:text-orange-100">
                    <Send className="h-5 w-5" />✅ What Will Happen:
                  </h4>
                  <div className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-lg">📱</span>
                      When lead changes to{" "}
                      <Badge
                        className={
                          statusStyles[
                            selectedStatus as keyof typeof statusStyles
                          ]
                        }
                      >
                        {getStatusInfo(selectedStatus).label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      System automatically sends WhatsApp
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      Using campaign:{" "}
                      <strong>
                        {(
                          document.getElementById(
                            "campaignName",
                          ) as HTMLInputElement
                        )?.value || "Not set yet"}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      Activity logged in lead timeline
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={upsertTrigger.isPending}
                className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                size="lg"
              >
                {upsertTrigger.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingTrigger ? "💾 Update Trigger" : "✨ Create Trigger"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
