"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface ExportLeadsButtonProps {
  filters?: {
    status?: string;
    source?: string;
    ownerId?: string;
    priority?: string;
    search?: string;
  };
}

export function ExportLeadsButton({ filters = {} }: ExportLeadsButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/trpc/lead.exportToCSV", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: filters,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const data = (await response.json()) as {
        result: { data: { json: unknown[] } };
      };
      const leads = data.result.data.json;

      // Convert to CSV using PapaParse
      const csv = Papa.unparse(leads);

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Leads exported successfully");
    } catch (error) {
      toast.error("Failed to export leads");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting}>
      <IconDownload className="mr-2 h-4 w-4" />
      {exporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
