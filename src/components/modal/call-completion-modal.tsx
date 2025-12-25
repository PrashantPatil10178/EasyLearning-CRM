"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import {
  Loader2,
  Clock,
  Phone,
  User2,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  PhoneOff,
  Voicemail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const callCompletionSchema = z.object({
  callDuration: z.string().optional(),
  callOutcome: z.enum(["ANSWERED", "NO_ANSWER", "BUSY", "VOICEMAIL", "FAILED"]),
  callNotes: z.string().min(5, "Please add at least 5 characters of notes"),
  leadStatus: z.string().optional(),
  nextFollowUp: z.string().optional(),
  callQuality: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"]).optional(),
  customerInterest: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]).optional(),
});

type CallCompletionFormValues = z.infer<typeof callCompletionSchema>;

interface CallCompletionModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCurrentStatus?: string;
  onSave?: () => void;
}

const LEAD_STATUSES = [
  { value: "NEW", label: "New Lead" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL", label: "Proposal Sent" },
  { value: "NEGOTIATION", label: "In Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
  { value: "FOLLOW_UP", label: "Follow Up" },
];

const CALL_OUTCOMES = [
  {
    value: "ANSWERED",
    label: "Call Answered",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950",
    description: "Customer picked up and had conversation",
  },
  {
    value: "NO_ANSWER",
    label: "No Answer",
    icon: PhoneOff,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    description: "Customer didn't pick up the call",
  },
  {
    value: "BUSY",
    label: "Busy",
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950",
    description: "Line was busy",
  },
  {
    value: "VOICEMAIL",
    label: "Voicemail",
    icon: Voicemail,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    description: "Left a voicemail message",
  },
  {
    value: "FAILED",
    label: "Failed",
    icon: XCircle,
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-950",
    description: "Call failed to connect",
  },
];

const CALL_QUALITY = [
  { value: "EXCELLENT", label: "Excellent", emoji: "🌟" },
  { value: "GOOD", label: "Good", emoji: "👍" },
  { value: "FAIR", label: "Fair", emoji: "👌" },
  { value: "POOR", label: "Poor", emoji: "👎" },
];

const CUSTOMER_INTEREST = [
  { value: "HIGH", label: "High Interest", color: "bg-green-500" },
  { value: "MEDIUM", label: "Medium Interest", color: "bg-yellow-500" },
  { value: "LOW", label: "Low Interest", color: "bg-orange-500" },
  { value: "NONE", label: "Not Interested", color: "bg-red-500" },
];

export function CallCompletionModal({
  open,
  onClose,
  leadId,
  leadName,
  leadPhone,
  leadCurrentStatus,
  onSave,
}: CallCompletionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const utils = api.useUtils();

  // Timer for elapsed time
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (new Date().getTime() - callStartTime.getTime()) / 1000,
      );
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [open, callStartTime]);

  const form = useForm<CallCompletionFormValues>({
    resolver: zodResolver(callCompletionSchema),
    defaultValues: {
      callOutcome: "ANSWERED",
      callNotes: "",
      leadStatus: leadCurrentStatus || "",
      callDuration: "",
      nextFollowUp: "",
      callQuality: "GOOD",
      customerInterest: "MEDIUM",
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const completeCallMutation = api.callLog.complete.useMutation({
    onSuccess: async () => {
      toast.success("Call details saved successfully");
      // Invalidate and refetch for real-time updates
      await utils.lead.getById.invalidate({ id: leadId });
      await utils.activity.getByLeadId.invalidate({ leadId });
      await utils.task.getByLeadId.invalidate({ leadId });

      // Call the parent's refetch callback for immediate UI updates
      if (onSave) {
        onSave();
      }

      setIsSubmitting(false);
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save call details");
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: CallCompletionFormValues) => {
    setIsSubmitting(true);

    completeCallMutation.mutate({
      leadId,
      outcome: data.callOutcome,
      notes: data.callNotes,
      duration: data.callDuration ? parseInt(data.callDuration) : undefined,
      newStatus:
        data.leadStatus !== leadCurrentStatus ? data.leadStatus : undefined,
      nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[95vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Complete Call Details
            </DialogTitle>
            <Badge variant="secondary" className="gap-1.5 font-mono text-sm">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedTime)}
            </Badge>
          </div>
          <div className="bg-muted/50 space-y-2 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm">
              <User2 className="text-muted-foreground h-4 w-4" />
              <span className="font-semibold">{leadName}</span>
              <Badge variant="outline">{leadCurrentStatus}</Badge>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              <span className="font-mono">{leadPhone}</span>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Call Outcome - Enhanced with icons */}
            <FormField
              control={form.control}
              name="callOutcome"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">
                    Call Outcome *
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {CALL_OUTCOMES.map((outcome) => {
                        const Icon = outcome.icon;
                        return (
                          <div key={outcome.value}>
                            <RadioGroupItem
                              value={outcome.value}
                              id={outcome.value}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={outcome.value}
                              className={`hover:bg-accent peer-data-[state=checked]:border-primary flex cursor-pointer flex-col items-start gap-2 rounded-lg border-2 p-4 transition-all peer-data-[state=checked]:${outcome.bgColor}`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${outcome.color}`} />
                                <span className="font-semibold">
                                  {outcome.label}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-xs">
                                {outcome.description}
                              </p>
                            </label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Call Quality & Customer Interest */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="callQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Call Quality
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Rate call quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CALL_QUALITY.map((quality) => (
                          <SelectItem key={quality.value} value={quality.value}>
                            {quality.emoji} {quality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      How was the call connection?
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerInterest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Customer Interest Level
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select interest level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CUSTOMER_INTEREST.map((interest) => (
                          <SelectItem
                            key={interest.value}
                            value={interest.value}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${interest.color}`}
                              />
                              {interest.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Customer's level of interest
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* Call Duration */}
            <FormField
              control={form.control}
              name="callDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">
                    Call Duration (seconds)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                      <Input
                        type="number"
                        placeholder="e.g., 120"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Suggested: {formatTime(elapsedTime)} ({elapsedTime}s)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Call Notes */}
            <FormField
              control={form.control}
              name="callNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    Call Notes / Discussion Summary *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What was discussed? Customer responses? Key points? Next steps?"
                      className="min-h-[140px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Detailed notes help track customer interactions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Update Lead Section */}
            <div className="bg-muted/30 space-y-4 rounded-lg p-4">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Star className="h-4 w-4" />
                Update Lead Information
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="leadStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Keep current status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEAD_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                              {status.value === leadCurrentStatus &&
                                " (Current)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Update if status changed during call
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextFollowUp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Next Follow-up</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                          <Input
                            type="datetime-local"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        When to contact them again?
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Call Details
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
