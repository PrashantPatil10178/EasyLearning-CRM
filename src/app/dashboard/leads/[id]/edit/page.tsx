"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import PageContainer from "@/components/layout/page-container";
import { LEAD_STATUS_HIERARCHY, statusDisplayNames } from "@/lib/lead-status";
import { useLeadStatuses } from "@/hooks/use-lead-statuses";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    courseInterested: "",
    status: "",
    priority: "MEDIUM",
    source: "MANUAL",
    notes: "",
  });
  
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  const { data: lead, isLoading } = api.lead.getById.useQuery({ id: leadId });
  
  // Fetch custom fields configuration
  const { data: customFields, isLoading: isLoadingFields } = api.settings.getLeadFields.useQuery();
  
  // Fetch custom statuses
  const { categories: statusCategories, allStatuses } = useLeadStatuses();

  const updateMutation = api.lead.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      router.push(`/dashboard/leads/${leadId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update lead");
    },
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        phone: lead.phone || "",
        city: lead.city || "",
        state: lead.state || "",
        pincode: lead.pincode || "",
        courseInterested: lead.courseInterested || "",
        status: lead.status || "",
        priority: lead.priority || "MEDIUM",
        source: lead.source || "MANUAL",
        notes: lead.notes || "",
      });
      
      // Parse custom fields
      if (lead.customFields) {
        try {
          const parsed = JSON.parse(lead.customFields);
          setCustomFieldsData(parsed);
        } catch (e) {
          console.error("Failed to parse custom fields:", e);
          setCustomFieldsData({});
        }
      }
    }
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.phone) {
      toast.error("First name and phone are required");
      return;
    }

    updateMutation.mutate({
      id: leadId,
      ...formData,
      customFields: JSON.stringify(customFieldsData),
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleCustomFieldChange = (key: string, value: any) => {
    setCustomFieldsData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!lead) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <h2 className="text-xl font-semibold">Lead not found</h2>
          <Button asChild className="mt-4">
            <Link href="/dashboard/leads">Back to Leads</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 gap-2 pl-0"
              asChild
            >
              <Link href={`/dashboard/leads/${leadId}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to Lead Details
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Edit Lead</h1>
            <p className="text-muted-foreground mt-1">
              Update lead information
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
              <CardDescription>
                Update the lead's contact and status information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleChange("firstName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => handleChange("pincode", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lead Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Lead Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="courseInterested">Course Interested</Label>
                    <Input
                      id="courseInterested"
                      value={formData.courseInterested}
                      onChange={(e) =>
                        handleChange("courseInterested", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange("status", value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusCategories.map((category) => (
                          <div key={category.value}>
                            <div className="text-muted-foreground px-2 py-1.5 text-sm font-semibold">
                              {category.label}
                            </div>
                            {category.statuses.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleChange("priority", value)}
                    >
                      <SelectTrigger id="priority">
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
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => handleChange("source", value)}
                    >
                      <SelectTrigger id="source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="WEBSITE">Website</SelectItem>
                        <SelectItem value="REFERRAL">Referral</SelectItem>
                        <SelectItem value="SOCIAL_MEDIA">
                          Social Media
                        </SelectItem>
                        <SelectItem value="ADVERTISEMENT">
                          Advertisement
                        </SelectItem>
                        <SelectItem value="COLD_CALL">Cold Call</SelectItem>
                        <SelectItem value="IMPORT">Import</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Custom Fields */}
              {customFields && customFields.filter(f => f.isVisible).length > 0 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {customFields
                        .filter((field) => field.isVisible)
                        .map((field) => {
                          const value = customFieldsData[field.key] || \"\";
                          
                          if (field.type === \"SELECT\") {
                            let options: string[] = [];
                            try {
                              options = JSON.parse(field.options || \"[]\");
                            } catch (e) {
                              options = [];
                            }
                            
                            return (
                              <div key={field.id} className=\"space-y-2\">
                                <Label htmlFor={field.key}>
                                  {field.name}
                                  {field.isRequired && <span className=\"text-red-500 ml-1\">*</span>}
                                </Label>
                                <Select
                                  value={value}
                                  onValueChange={(val) => handleCustomFieldChange(field.key, val)}
                                >
                                  <SelectTrigger id={field.key}>
                                    <SelectValue placeholder={`Select ${field.name}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                          
                          if (field.type === \"TEXTAREA\") {
                            return (
                              <div key={field.id} className=\"space-y-2 md:col-span-2\">
                                <Label htmlFor={field.key}>
                                  {field.name}
                                  {field.isRequired && <span className=\"text-red-500 ml-1\">*</span>}
                                </Label>
                                <Textarea
                                  id={field.key}
                                  value={value}
                                  onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                  rows={3}
                                  placeholder={field.name}
                                />
                              </div>
                            );
                          }
                          
                          if (field.type === \"BOOLEAN\") {
                            return (
                              <div key={field.id} className=\"flex items-center space-x-2\">
                                <Checkbox
                                  id={field.key}
                                  checked={!!value}
                                  onCheckedChange={(checked) => handleCustomFieldChange(field.key, checked)}
                                />
                                <Label htmlFor={field.key} className=\"cursor-pointer\">
                                  {field.name}
                                  {field.isRequired && <span className=\"text-red-500 ml-1\">*</span>}
                                </Label>
                              </div>
                            );
                          }
                          
                          // Default: TEXT, NUMBER, EMAIL, etc.
                          return (
                            <div key={field.id} className=\"space-y-2\">
                              <Label htmlFor={field.key}>
                                {field.name}
                                {field.isRequired && <span className=\"text-red-500 ml-1\">*</span>}
                              </Label>
                              <Input
                                id={field.key}
                                type={field.type === \"EMAIL\" ? \"email\" : field.type === \"NUMBER\" ? \"number\" : \"text\"}
                                value={value}
                                onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                                placeholder={field.name}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={4}
                  placeholder="Add any additional notes about this lead..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
