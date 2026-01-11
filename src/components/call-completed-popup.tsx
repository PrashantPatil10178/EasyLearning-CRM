"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Clock, User, ExternalLink, Edit2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useLeadStatuses } from "@/hooks/use-lead-statuses";

interface CallCompletedPopupProps {
  call: {
    id?: string;
    type?: string;
    status?: string;
    duration?: number;
    toNumber?: string;
    fromNumber?: string;
    recordingUrl?: string;
    notes?: string;
    outcome?: string;
    lead?: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      status?: string;
      category?: string;
      priority?: string;
      city?: string;
      state?: string;
      courseInterested?: string;
      revenue?: number;
      customFields?: string;
    };
  };
  onClose: () => void;
  open: boolean;
}

export function CallCompletedPopup({
  call,
  onClose,
  open,
}: CallCompletedPopupProps) {
  console.log("[CallCompletedPopup] Rendered with:", {
    open,
    callId: call?.id,
    leadId: call?.lead?.id,
  });
  const [autoClose, setAutoClose] = useState(15);
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<string | undefined>(undefined);
  const [leadStatus, setLeadStatus] = useState<string | undefined>(undefined);
  const [leadCategory, setLeadCategory] = useState<string | undefined>(
    undefined,
  );

  // Lead fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [courseInterested, setCourseInterested] = useState("");
  const [priority, setPriority] = useState("");
  const [revenue, setRevenue] = useState("");
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>(
    {},
  );

  const { categories } = useLeadStatuses();
  const allStatuses = categories?.flatMap((c) => c.statuses) || [];

  // Fetch custom fields configuration
  const { data: customFields } = api.settings.getLeadFields.useQuery();

  const utils = api.useUtils();
  const updateCallMutation = api.callLog.update.useMutation({
    onSuccess: () => {
      toast.success("Call details saved");
      setIsEditing(false);
      utils.campaign.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const updateLeadMutation = api.lead.update.useMutation({
    onSuccess: () => {
      utils.campaign.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update lead: " + error.message);
    },
  });

  useEffect(() => {
    console.log(
      "[CallCompletedPopup] useEffect triggered - open:",
      open,
      "call:",
      call,
    );
    if (open) {
      console.log("[CallCompletedPopup] Initializing popup state");
      setNotes(call.notes || "");
      setOutcome(call.outcome || undefined);
      setLeadStatus(call.lead?.status || undefined);
      setLeadCategory(call.lead?.category || undefined);
      setAutoClose(15);

      // Initialize lead fields
      if (call.lead) {
        setFirstName(call.lead.firstName || "");
        setLastName(call.lead.lastName || "");
        setEmail(call.lead.email || "");
        setPhone(call.lead.phone || "");
        setCity(call.lead.city || "");
        setState(call.lead.state || "");
        setCourseInterested(call.lead.courseInterested || "");
        setPriority(call.lead.priority || "MEDIUM");
        setRevenue(call.lead.revenue?.toString() || "");

        // Parse custom fields
        let parsed = {};
        if (call.lead.customFields) {
          try {
            parsed = JSON.parse(call.lead.customFields);
          } catch (e) {
            parsed = {};
          }
        }
        setCustomFieldsData(parsed);
      }

      // Auto-enable edit mode if there's no outcome set upon completion!
      if (!call.outcome) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    }
  }, [open, call]);

  // Pause auto-close when editing
  useEffect(() => {
    if (!open || isEditing) return;

    const interval = setInterval(() => {
      setAutoClose((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, onClose, isEditing]);

  const handleSave = async () => {
    if (!call.id || !call.lead?.id) return;

    // Update call details
    await updateCallMutation.mutateAsync({
      id: call.id,
      notes,
      outcome,
      leadStatus,
    });

    // Update lead details
    const leadUpdates: any = {
      id: call.lead.id,
      firstName,
      lastName,
      email,
      phone,
      city,
      state,
      courseInterested,
      priority,
      revenue: parseFloat(revenue) || 0,
      category: leadCategory,
      status: leadStatus,
      customFields: JSON.stringify(customFieldsData),
    };

    await updateLeadMutation.mutateAsync(leadUpdates);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      COMPLETED: { variant: "default", label: "Completed" },
      NO_ANSWER: { variant: "secondary", label: "No Answer" },
      BUSY: { variant: "destructive", label: "Busy" },
      FAILED: { variant: "destructive", label: "Failed" },
    };

    const statusInfo = statusMap[status || ""] || {
      variant: "outline",
      label: status || "Unknown",
    };
    return (
      <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="my-0 max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Call Completed - Update Lead
          </DialogTitle>
          <DialogDescription>
            Call with{" "}
            {call.lead
              ? `${call.lead.firstName} ${call.lead.lastName}`
              : call.toNumber}{" "}
            has ended
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Read-only details section */}
          <div className="bg-muted/20 grid grid-cols-2 gap-2 rounded-lg p-2 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Call Status</span>
              <div>{getStatusBadge(call.status)}</div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" /> Duration
              </span>
              <span className="text-sm font-medium">
                {formatDuration(call.duration)}
              </span>
            </div>
          </div>

          {call.recordingUrl && (
            <div className="">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={() => window.open(call.recordingUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                Listen to Recording
              </Button>
            </div>
          )}

          {/* Edit Section */}
          <div className="space-y-3 border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Call Details</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>

            {isEditing ? (
              <div className="animate-in fade-in zoom-in-95 space-y-3 duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="outcome" className="text-xs">
                      Call Outcome
                    </Label>
                    <Select value={outcome} onValueChange={setOutcome}>
                      <SelectTrigger id="outcome" className="h-8">
                        <SelectValue placeholder="Outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTERESTED">Interested</SelectItem>
                        <SelectItem value="NOT_INTERESTED">
                          Not Interested
                        </SelectItem>
                        <SelectItem value="CALLBACK_REQUESTED">
                          Callback Requested
                        </SelectItem>
                        <SelectItem value="WRONG_NUMBER">
                          Wrong Number
                        </SelectItem>
                        <SelectItem value="NOT_REACHABLE">
                          Not Reachable
                        </SelectItem>
                        <SelectItem value="CALL_BACK_LATER">
                          Call Back Later
                        </SelectItem>
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                        <SelectItem value="INFORMATION_SHARED">
                          Info Shared
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="leadStatus" className="text-xs">
                      Lead Status
                    </Label>
                    <Select value={leadStatus} onValueChange={setLeadStatus}>
                      <SelectTrigger id="leadStatus" className="h-8">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <div key={category.value}>
                            <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
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
                </div>

                <div className="space-y-1">
                  <Label htmlFor="leadCategory" className="text-xs">
                    Lead Category
                  </Label>
                  <Select value={leadCategory} onValueChange={setLeadCategory}>
                    <SelectTrigger id="leadCategory" className="h-8">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRESH">Fresh</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Personal Information */}
                <div className="border-t pt-2">
                  <div className="mb-2 text-xs font-semibold">
                    Personal Information
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-xs">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-xs">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Course & Location */}
                <div className="border-t pt-2">
                  <div className="mb-2 text-xs font-semibold">
                    Course & Location
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="courseInterested" className="text-xs">
                        Course Interested
                      </Label>
                      <Input
                        id="courseInterested"
                        value={courseInterested}
                        onChange={(e) => setCourseInterested(e.target.value)}
                        placeholder="e.g., JEE, NEET"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="city" className="text-xs">
                          City
                        </Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="state" className="text-xs">
                          State
                        </Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority & Revenue */}
                <div className="border-t pt-2">
                  <div className="mb-2 text-xs font-semibold">
                    Priority & Revenue
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="priority" className="text-xs">
                        Priority
                      </Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger id="priority" className="h-8">
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
                    <div className="space-y-1">
                      <Label htmlFor="revenue" className="text-xs">
                        Revenue (₹)
                      </Label>
                      <Input
                        id="revenue"
                        type="number"
                        value={revenue}
                        onChange={(e) => setRevenue(e.target.value)}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Fields */}
                {customFields &&
                  customFields.filter((f) => f.isVisible).length > 0 && (
                    <div className="border-t pt-2">
                      <div className="mb-2 text-xs font-semibold">
                        Additional Information
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {customFields
                          .filter((field) => field.isVisible)
                          .map((field) => {
                            const value = customFieldsData[field.key] || "";

                            if (field.type === "SELECT") {
                              let options: string[] = [];
                              try {
                                options = JSON.parse(field.options || "[]");
                              } catch (e) {
                                options = [];
                              }

                              return (
                                <div key={field.id} className="space-y-1">
                                  <Label
                                    htmlFor={field.key}
                                    className="text-xs"
                                  >
                                    {field.name}
                                  </Label>
                                  <Select
                                    value={value}
                                    onValueChange={(val) =>
                                      setCustomFieldsData({
                                        ...customFieldsData,
                                        [field.key]: val,
                                      })
                                    }
                                  >
                                    <SelectTrigger
                                      id={field.key}
                                      className="h-8"
                                    >
                                      <SelectValue
                                        placeholder={`Select ${field.name}`}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {options.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                          {opt}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            }

                            return (
                              <div key={field.id} className="space-y-1">
                                <Label htmlFor={field.key} className="text-xs">
                                  {field.name}
                                </Label>
                                <Input
                                  id={field.key}
                                  type={
                                    field.type === "NUMBER"
                                      ? "number"
                                      : field.type === "EMAIL"
                                        ? "email"
                                        : "text"
                                  }
                                  value={value}
                                  onChange={(e) =>
                                    setCustomFieldsData({
                                      ...customFieldsData,
                                      [field.key]: e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add call notes..."
                    className="min-h-[80px] resize-none text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div
                className="bg-muted/30 hover:bg-muted/50 cursor-pointer space-y-2 rounded-md p-2 text-sm transition-colors"
                onClick={() => setIsEditing(true)}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block text-xs">
                      Call Outcome
                    </span>
                    <span className="font-medium">
                      {outcome || call.outcome || "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">
                      Lead Status
                    </span>
                    <span className="font-medium">
                      {leadStatus || call.lead?.status || "Not set"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">
                    Notes
                  </span>
                  <p className="text-muted-foreground text-xs whitespace-pre-wrap italic">
                    {notes || call.notes || "No notes added."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="text-muted-foreground flex items-center justify-between pt-2 text-xs">
            {!isEditing && <span>Auto-closing in {autoClose}s</span>}
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateCallMutation.isPending}
                >
                  {updateCallMutation.isPending ? "Saving..." : "Save"}{" "}
                  <Save className="ml-2 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
