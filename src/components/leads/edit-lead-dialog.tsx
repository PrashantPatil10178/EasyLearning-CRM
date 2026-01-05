"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLeadStatuses } from "@/hooks/use-lead-statuses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { IconLoader2 } from "@tabler/icons-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Base schema for fixed fields
const baseSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  source: z.string(),
  status: z.string(),
  priority: z.string(),
  nextFollowUp: z.string().optional(),
  ownerId: z.string().optional(),
  campaign: z.string().optional(),
});

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
}

export function EditLeadDialog({
  open,
  onOpenChange,
  lead,
}: EditLeadDialogProps) {
  const router = useRouter();
  const utils = api.useUtils();

  // Fetch custom lead statuses
  const { categories: statusCategories, isLoading: isLoadingStatuses } =
    useLeadStatuses();

  // Fetch custom fields
  const { data: customFields, isLoading: isLoadingFields } =
    api.settings.getLeadFields.useQuery();

  // Fetch users for assignment
  const { data: users, isLoading: isLoadingUsers } = api.user.getAll.useQuery();

  // Fetch campaigns
  const { data: campaigns, isLoading: isLoadingCampaigns } =
    api.campaign.getAll.useQuery({ page: 1, limit: 100 });

  // Dynamic schema generation
  const formSchema = z.lazy(() => {
    const dynamicShape: Record<string, any> = {};

    customFields?.forEach((field) => {
      if (field.isVisible) {
        let validator: any = z.string();

        if (field.type === "NUMBER") {
          validator = z
            .string()
            .transform((val) => (val === "" ? undefined : Number(val)));
        } else if (field.type === "BOOLEAN") {
          validator = z.boolean();
        } else if (field.type === "EMAIL") {
          validator = z.string().email().optional().or(z.literal(""));
        }

        if (field.isRequired) {
          if (field.type !== "BOOLEAN") {
            validator = validator.min(1, `${field.name} is required`);
          }
        } else {
          validator = validator.optional();
        }

        dynamicShape[field.key] = validator;
      }
    });

    return baseSchema.and(z.object(dynamicShape));
  });

  // Parse custom fields from lead
  let parsedCustomFields = {};
  try {
    parsedCustomFields = lead.customFields ? JSON.parse(lead.customFields) : {};
  } catch (e) {
    parsedCustomFields = {};
  }

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "WEBSITE",
      status: lead.status || "NEW_LEAD",
      priority: lead.priority || "MEDIUM",
      nextFollowUp: lead.nextFollowUp
        ? new Date(lead.nextFollowUp).toISOString().slice(0, 16)
        : "",
      ownerId: lead.ownerId || "",
      campaign: lead.campaign || "",
      ...parsedCustomFields,
    },
  });

  const updateLead = api.lead.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      onOpenChange(false);
      form.reset();
      router.refresh();
      utils.lead.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(data: any) {
    const {
      firstName,
      lastName,
      email,
      phone,
      source,
      status,
      priority,
      nextFollowUp,
      ownerId,
      campaign,
      ...customData
    } = data;

    updateLead.mutate({
      id: lead.id,
      firstName,
      lastName,
      email,
      phone,
      source,
      status,
      priority,
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : undefined,
      ownerId: ownerId || undefined,
      campaign: campaign || undefined,
      customFields: JSON.stringify(customData),
    });
  }

  const renderFieldInput = (field: any, formField: any) => {
    switch (field.type) {
      case "SELECT":
        let options: string[] = [];
        try {
          options = JSON.parse(field.options || "[]");
        } catch (e) {
          options = [];
        }
        return (
          <Select
            onValueChange={formField.onChange}
            defaultValue={formField.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.name}`} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "BOOLEAN":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formField.value}
              onCheckedChange={formField.onChange}
            />
            <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {field.name}
            </label>
          </div>
        );
      case "NUMBER":
        return (
          <Input
            type="number"
            placeholder={field.name}
            {...formField}
            onChange={(e) => formField.onChange(e.target.value)}
          />
        );
      case "DATE":
        return <Input type="date" {...formField} />;
      default:
        return <Input placeholder={field.name} {...formField} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the lead information below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mr-4 flex-1 pr-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingStatuses}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusCategories.map((category) => (
                            <div key={category.value}>
                              <div className="text-muted-foreground px-2 py-1.5 text-sm font-semibold">
                                {category.label}
                              </div>
                              {category.statuses.map((status) => (
                                <SelectItem
                                  key={status.id}
                                  value={status.value}
                                >
                                  {status.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="ownerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="campaign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select campaign (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {campaigns?.campaigns?.map((campaign: any) => (
                          <SelectItem key={campaign.id} value={campaign.name}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Fields Section */}
              {isLoadingFields ? (
                <div className="flex justify-center py-4">
                  <IconLoader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : (
                customFields &&
                customFields.length > 0 && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                      Additional Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {customFields
                        ?.filter((f) => f.isVisible)
                        .map((field) => (
                          <FormField
                            key={field.id}
                            control={form.control}
                            name={field.key}
                            render={({ field: formField }) => (
                              <FormItem
                                className={
                                  field.type === "BOOLEAN"
                                    ? "flex items-end pb-2"
                                    : ""
                                }
                              >
                                {field.type !== "BOOLEAN" && (
                                  <FormLabel>
                                    {field.name} {field.isRequired && "*"}
                                  </FormLabel>
                                )}
                                <FormControl>
                                  {renderFieldInput(field, formField)}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                    </div>
                  </div>
                )
              )}

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateLead.isPending}>
                  {updateLead.isPending && (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Lead
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
