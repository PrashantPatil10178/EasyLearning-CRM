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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  IconUpload,
  IconArrowRight,
  IconArrowLeft,
  IconLoader2,
} from "@tabler/icons-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { FileUploader } from "@/components/file-uploader";

const CRM_FIELDS = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: true },
  { key: "altPhone", label: "Alternate Phone", required: false },
  { key: "source", label: "Source", required: false },
  { key: "status", label: "Status", required: false },
  { key: "priority", label: "Priority", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "courseInterested", label: "Course Interested", required: false },
  { key: "campaign", label: "Campaign", required: false },
  { key: "ownerId", label: "Assign To (User ID)", required: false },
];

export function ImportLeadsWizard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

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
    setStep(1);
    setFiles([]);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const handleFileSelect = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      setFiles([file]);
      parseFile(file);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 5, // Preview first 5 rows for mapping
      complete: (results) => {
        if (results.meta.fields) {
          setCsvHeaders(results.meta.fields);
          setCsvData(results.data);
          autoMapFields(results.meta.fields);
          setStep(2);
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const autoMapFields = (headers: string[]) => {
    const newMapping: Record<string, string> = {};
    CRM_FIELDS.forEach((field) => {
      const match = headers.find(
        (header) =>
          header.toLowerCase().replace(/[^a-z0-9]/g, "") ===
            field.key.toLowerCase() ||
          header.toLowerCase().replace(/[^a-z0-9]/g, "") ===
            field.label.toLowerCase().replace(/[^a-z0-9]/g, ""),
      );
      if (match) {
        newMapping[field.key] = match;
      }
    });
    setMapping(newMapping);
  };

  const handleMappingChange = (crmField: string, csvHeader: string) => {
    setMapping((prev) => ({ ...prev, [crmField]: csvHeader }));
  };

  const handleContinueToPreview = () => {
    // Validate required fields
    const missingRequired = CRM_FIELDS.filter(
      (f) => f.required && !mapping[f.key],
    );
    if (missingRequired.length > 0) {
      toast.error(
        `Please map required fields: ${missingRequired
          .map((f) => f.label)
          .join(", ")}`,
      );
      return;
    }
    setStep(3);
  };

  const handleImport = () => {
    setImporting(true);

    // Parse the full file now
    if (files.length === 0) return;

    Papa.parse(files[0], {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data as Record<string, any>[];

        const formattedLeads = rawData
          .map((row) => {
            const lead: any = {};
            Object.entries(mapping).forEach(([crmKey, csvHeader]) => {
              if (csvHeader && row[csvHeader] !== undefined) {
                const value = row[csvHeader]?.trim();
                // Only add if value is not empty string
                if (value) {
                  lead[crmKey] = value;
                }
              }
            });
            return lead;
          })
          .filter((lead) => lead.firstName && lead.phone); // Basic validation

        if (formattedLeads.length === 0) {
          toast.error("No valid leads found to import");
          setImporting(false);
          return;
        }

        try {
          await importMutation.mutateAsync({
            leads: formattedLeads,
            assignToMe: true, // Default to assigning to current user if not specified
          });
        } catch (error) {
          // Error handled by mutation onError
          setImporting(false);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconUpload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            {step === 1 && "Upload a CSV file to import leads."}
            {step === 2 && "Map columns from your CSV to CRM fields."}
            {step === 3 && "Review and confirm import."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4">
              <FileUploader
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                onValueChange={handleFileSelect}
                accept={{ "text/csv": [".csv"] }}
              />
              <div className="text-muted-foreground text-sm">
                <p>Supported file type: CSV</p>
                <p>Required columns: First Name, Phone</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="text-muted-foreground mb-2 grid grid-cols-2 gap-4 text-sm font-medium">
                  <div>CRM Field</div>
                  <div>CSV Column</div>
                </div>
                {CRM_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-2 items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`map-${field.key}`}>{field.label}</Label>
                      {field.required && (
                        <span className="text-xs text-red-500">*</span>
                      )}
                    </div>
                    <Select
                      value={mapping[field.key] || "ignore"}
                      onValueChange={(value) =>
                        handleMappingChange(
                          field.key,
                          value === "ignore" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger id={`map-${field.key}`}>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ignore">
                          <span className="text-muted-foreground">
                            (Do not import)
                          </span>
                        </SelectItem>
                        {csvHeaders
                          .filter((header) => header && header.trim() !== "")
                          .map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {CRM_FIELDS.filter((f) => mapping[f.key]).map((field) => (
                        <TableHead key={field.key}>{field.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {CRM_FIELDS.filter((f) => mapping[f.key]).map(
                          (field) => (
                            <TableCell key={field.key}>
                              {row[mapping[field.key]!] || "-"}
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-muted-foreground text-sm">
                Showing preview of first 5 rows. Total rows to import will be
                calculated upon confirmation.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as any)}
                disabled={importing}
              >
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 1 && (
              <Button disabled={files.length === 0} onClick={() => {}}>
                Select a file to continue
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleContinueToPreview}>
                Next
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleImport} disabled={importing}>
                {importing && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Import Leads
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
