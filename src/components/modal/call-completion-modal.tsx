"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";

const callCompletionSchema = z.object({
  callDuration: z.string().optional(),
  callOutcome: z.enum(["ANSWERED", "NO_ANSWER", "BUSY", "VOICEMAIL", "FAILED"]),
  callNotes: z.string().min(1, "Please add call notes"),
  leadStatus: z.string().optional(),
  nextFollowUp: z.string().optional(),
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
  { value: "ANSWERED", label: "Call Answered" },
  { value: "NO_ANSWER", label: "No Answer" },
  { value: "BUSY", label: "Busy" },
  { value: "VOICEMAIL", label: "Voicemail" },
  { value: "FAILED", label: "Failed" },
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
  const utils = api.useUtils();

  const form = useForm<CallCompletionFormValues>({
    resolver: zodResolver(callCompletionSchema),
    defaultValues: {
      callOutcome: "ANSWERED",
      callNotes: "",
      leadStatus: leadCurrentStatus || "",
      callDuration: "",
      nextFollowUp: "",
    },
  });

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Call Details</DialogTitle>
          <DialogDescription>
            Record the outcome and notes for your call with {leadName} (
            {leadPhone})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <FormField
                control={form.control}
                name="callOutcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Outcome *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CALL_OUTCOMES.map((outcome) => (
                          <SelectItem key={outcome.value} value={outcome.value}>
                            {outcome.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="callDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Duration (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 120" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="callNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Call Notes / Manuscript *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What was discussed? Customer responses? Key points?"
                      className="min-h-[100px] text-sm sm:min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-3 sm:pt-4">
              <h3 className="mb-3 text-sm font-medium sm:mb-4 sm:text-base">
                Update Lead Information
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextFollowUp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Follow-up</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
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
