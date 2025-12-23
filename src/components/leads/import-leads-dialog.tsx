"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconAlertCircle,
  IconDownload,
  IconX,
  IconLoader2,
} from "@tabler/icons-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { FileUploader } from "@/components/file-uploader";

interface LeadRow {
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  altPhone?: string;
  source?: string;
  status?: string;
  priority?: string;
  [key: string]: any; // Allow dynamic fields
}

export function ImportLeadsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Fetch custom fields to include in template
  const { data: customFields, isLoading: isLoadingFields } =
    api.settings.getLeadFields.useQuery();

  // Fetch users for assignment
  const { data: users, isLoading: isLoadingUsers } = api.user.getAll.useQuery();

  // Fetch campaigns for assignment
  const { data: campaigns, isLoading: isLoadingCampaigns } =
    api.campaign.getAll.useQuery({ page: 1, limit: 100 });

  const importMutation = api.lead.importFromCSV.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.count} leads`);
      setOpen(false);
      resetState();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetState = () => {
    setFiles([]);
    setLeads([]);
    setMissingFields([]);
    setDefaultValues({});
    setParseError(null);
  };

  useEffect(() => {
    if (files.length > 0) {
      const file = files[0];
      if (file) {
        parseFile(file);
      }
    } else {
      setLeads([]);
      setMissingFields([]);
      setParseError(null);
    }
  }, [files, customFields]);

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.errors[0]) {
          setParseError(`Error parsing CSV: ${results.errors[0].message}`);
          return;
        }

        const rawData = results.data as Record<string, any>[];
        if (rawData.length === 0) {
          setParseError("The CSV file appears to be empty.");
          return;
        }

        // Create mapping from Header Name -> Internal Key
        const headerMap: Record<string, string> = {
          "First Name": "firstName",
          "Last Name": "lastName",
          Email: "email",
          Phone: "phone",
          "Alternate Phone": "altPhone",
          Source: "source",
          Status: "status",
          Priority: "priority",
          "Next Follow-up": "nextFollowUp",
          "Assign To": "ownerId",
          Campaign: "campaign",
          // Allow using keys directly too
          firstName: "firstName",
          lastName: "lastName",
          email: "email",
          phone: "phone",
          altPhone: "altPhone",
          source: "source",
          status: "status",
          priority: "priority",
          nextFollowUp: "nextFollowUp",
          ownerId: "ownerId",
          campaign: "campaign",
        };

        if (customFields) {
          customFields.forEach((field) => {
            headerMap[field.name] = field.key;
            headerMap[field.key] = field.key;
          });
        }

        const parsedLeads: LeadRow[] = rawData.map((row) => {
          const newRow: any = {};
          Object.keys(row).forEach((header) => {
            const key = headerMap[header] || header;
            newRow[key] =
              typeof row[header] === "string"
                ? row[header].trim()
                : row[header];
          });
          return newRow as LeadRow;
        });

        // Detect missing fields
        const csvHeaders = Object.keys(parsedLeads[0] || {});
        const requiredFields = ["status", "priority", "source"];
        const missing = requiredFields.filter(
          (field) => !csvHeaders.includes(field),
        );

        setMissingFields(missing);
        setLeads(parsedLeads);
        setParseError(null);

        // Set default values for missing fields
        const defaults: Record<string, any> = {};
        if (missing.includes("status")) defaults.status = "NEW";
        if (missing.includes("priority")) defaults.priority = "MEDIUM";
        if (missing.includes("source")) defaults.source = "WEBSITE";
        setDefaultValues(defaults);
      },
      error: (error) => {
        setParseError(`Error reading file: ${error.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (leads.length === 0) {
      toast.error("No leads to import");
      return;
    }

    setImporting(true);
    try {
      // Merge default values into each lead and filter out invalid leads
      const leadsWithDefaults = leads
        .map((lead) => ({
          ...defaultValues,
          ...lead,
          // Convert nextFollowUp if present
          nextFollowUp: lead.nextFollowUp
            ? new Date(lead.nextFollowUp).toISOString()
            : defaultValues.nextFollowUp
              ? new Date(defaultValues.nextFollowUp).toISOString()
              : undefined,
        }))
        .filter((lead) => {
          // Filter out leads that don't have required fields
          const hasFirstName = lead.firstName && lead.firstName.trim() !== "";
          const hasPhone = lead.phone && lead.phone.trim() !== "";
          return hasFirstName && hasPhone;
        });

      if (leadsWithDefaults.length === 0) {
        toast.error(
          "No valid leads found. Ensure firstName and phone are present.",
        );
        setImporting(false);
        return;
      }

      if (leadsWithDefaults.length < leads.length) {
        toast.warning(
          `${leads.length - leadsWithDefaults.length} invalid leads were skipped (missing firstName or phone)`,
        );
      }

      await importMutation.mutateAsync({
        leads: leadsWithDefaults,
        assignToMe: false, // Already handled via defaultValues.ownerId
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Base headers
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Alternate Phone",
      "Source",
      "Status",
      "Priority",
      "Campaign",
      "Next Follow-up",
      "Assign To",
    ];

    // Add custom field keys
    if (customFields) {
      customFields.forEach((field) => {
        if (field.isVisible) {
          headers.push(field.name);
        }
      });
    }

    // Create sample row
    const sampleRow = [
      "John",
      "Doe",
      "john@example.com",
      "9876543210",
      "",
      "WEBSITE",
      "NEW",
      "MEDIUM",
    ];

    // Add empty values for custom fields in sample row
    if (customFields) {
      customFields.forEach((field) => {
        if (field.isVisible) {
          if (field.type === "NUMBER") sampleRow.push("0");
          else if (field.type === "BOOLEAN") sampleRow.push("false");
          else sampleRow.push("");
        }
      });
    }

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "leads_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconUpload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Bulk import leads from a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Step 1: Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                1. Download Template
              </Label>
            </div>
            <Alert>
              <IconDownload className="h-4 w-4" />
              <AlertTitle>Get the latest template</AlertTitle>
              <AlertDescription className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Includes all your current custom fields.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  disabled={isLoadingFields}
                >
                  {isLoadingFields ? (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconFileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Download CSV
                </Button>
              </AlertDescription>
            </Alert>
          </div>

          {/* Step 2: Upload */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              2. Upload Filled CSV
            </Label>
            <FileUploader
              maxFiles={1}
              maxSize={5 * 1024 * 1024}
              accept={{ "text/csv": [".csv"] }}
              value={files}
              onValueChange={setFiles}
              className="min-h-[150px]"
            />
          </div>

          {/* Error Message */}
          {parseError && (
            <Alert variant="destructive">
              <IconAlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Default Values Form for Missing Fields */}
          {leads.length > 0 && !parseError && missingFields.length > 0 && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                3. Set Default Values for Missing Fields
              </Label>
              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Missing Fields Detected</AlertTitle>
                <AlertDescription className="text-sm">
                  Your CSV doesn't include some fields. Set default values below
                  for all imported leads.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                {missingFields.includes("status") && (
                  <div className="space-y-2">
                    <Label>Default Status</Label>
                    <Select
                      value={defaultValues.status || "NEW"}
                      onValueChange={(value) =>
                        setDefaultValues({ ...defaultValues, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
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
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {missingFields.includes("priority") && (
                  <div className="space-y-2">
                    <Label>Default Priority</Label>
                    <Select
                      value={defaultValues.priority || "MEDIUM"}
                      onValueChange={(value) =>
                        setDefaultValues({ ...defaultValues, priority: value })
                      }
                    >
                      <SelectTrigger>
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
                )}

                {missingFields.includes("source") && (
                  <div className="space-y-2">
                    <Label>Default Source</Label>
                    <Select
                      value={defaultValues.source || "WEBSITE"}
                      onValueChange={(value) =>
                        setDefaultValues({ ...defaultValues, source: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEBSITE">Website</SelectItem>
                        <SelectItem value="REFERRAL">Referral</SelectItem>
                        <SelectItem value="SOCIAL_MEDIA">
                          Social Media
                        </SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PHONE">Phone</SelectItem>
                        <SelectItem value="WALK_IN">Walk In</SelectItem>
                        <SelectItem value="ADVERTISEMENT">
                          Advertisement
                        </SelectItem>
                        <SelectItem value="PARTNER">Partner</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Always show Assign To and Next Follow-up as optional defaults */}
                <div className="space-y-2">
                  <Label>Assign All To (Optional)</Label>
                  <Select
                    value={defaultValues.ownerId || ""}
                    onValueChange={(value) =>
                      setDefaultValues({
                        ...defaultValues,
                        ownerId: value || undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Campaign (Optional)</Label>
                  <Select
                    value={defaultValues.campaign || ""}
                    onValueChange={(value) =>
                      setDefaultValues({
                        ...defaultValues,
                        campaign: value || undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns?.campaigns?.map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.name}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Next Follow-up (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={defaultValues.nextFollowUp || ""}
                    onChange={(e) =>
                      setDefaultValues({
                        ...defaultValues,
                        nextFollowUp: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {leads.length > 0 && !parseError && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  {missingFields.length > 0 ? "4. Preview" : "3. Preview"}
                </Label>
                <span className="text-muted-foreground text-sm">
                  {leads.length} leads found
                </span>
              </div>
              <div className="rounded-md border">
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(leads[0] || {})
                          .slice(0, 6)
                          .map((header) => (
                            <TableHead
                              key={header}
                              className="h-8 whitespace-nowrap"
                            >
                              {header}
                            </TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.slice(0, 10).map((row, i) => (
                        <TableRow key={i} className="h-8">
                          {Object.values(row)
                            .slice(0, 6)
                            .map((cell: any, j) => (
                              <TableCell
                                key={j}
                                className="py-1 whitespace-nowrap"
                              >
                                {String(cell)}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={leads.length === 0 || importing || !!parseError}
          >
            {importing ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Leads"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
