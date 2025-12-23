"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const statusUpdateSchema = z.object({
  status: z.enum([
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "NOT_INTERESTED",
    "FOLLOW_UP",
    "QUALIFIED",
    "NEGOTIATION",
    "CONVERTED",
    "LOST",
    "WON",
    "DONE",
  ]),
  notes: z.string().optional(),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

interface LeadStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    firstName: string;
    lastName?: string | null;
    status: string;
  } | null;
  onSuccess?: () => void;
}

export function LeadStatusUpdateDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: LeadStatusUpdateDialogProps) {
  const utils = api.useUtils();

  const updateStatusMutation = api.lead.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Lead status updated successfully");
      utils.lead.getAll.invalidate();
      utils.lead.getStats.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update lead status");
    },
  });

  const form = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: (lead?.status as any) || "CONTACTED",
      notes: "",
    },
  });

  const onSubmit = async (data: StatusUpdateFormValues) => {
    if (!lead) return;

    await updateStatusMutation.mutateAsync({
      id: lead.id,
      status: data.status,
    });

    // If notes provided, create a note
    if (data.notes?.trim()) {
      try {
        await utils.client.note.create.mutate({
          leadId: lead.id,
          content: `Call Follow-up: ${data.notes}`,
        });
      } catch (error) {
        console.error("Failed to create note:", error);
      }
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Lead Status</DialogTitle>
          <DialogDescription>
            Call completed for {lead.firstName} {lead.lastName || ""}. Update
            the lead status based on the call outcome.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="INTERESTED">Interested</SelectItem>
                      <SelectItem value="NOT_INTERESTED">
                        Not Interested
                      </SelectItem>
                      <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                      <SelectItem value="CONVERTED">Converted</SelectItem>
                      <SelectItem value="LOST">Lost</SelectItem>
                      <SelectItem value="WON">Won</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Update based on call outcome
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes about the call..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Document key points from the conversation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateStatusMutation.isPending}
              >
                Skip
              </Button>
              <Button type="submit" disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
