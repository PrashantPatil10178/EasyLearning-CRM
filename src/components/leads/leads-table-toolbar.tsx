"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IconEdit, IconUserShare, IconTrash } from "@tabler/icons-react";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";
import { ExportLeadsButton } from "@/components/leads/export-leads-button";
import { BulkEditDialog } from "@/components/leads/bulk-edit-dialog";
import { BulkAssignDialog } from "@/components/leads/bulk-assign-dialog";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

interface LeadsTableToolbarProps {
  filters?: {
    status?: string;
    source?: string;
    ownerId?: string;
    priority?: string;
    search?: string;
  };
}

export function LeadsTableToolbar({ filters }: LeadsTableToolbarProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const router = useRouter();

  const bulkDeleteMutation = api.lead.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully deleted ${data.count} leads`);
      setSelectedLeads([]);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedLeads.length} leads? This action cannot be undone.`,
      )
    ) {
      return;
    }

    await bulkDeleteMutation.mutateAsync({ leadIds: selectedLeads });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <ImportLeadsDialog />
        <ExportLeadsButton filters={filters} />

        {selectedLeads.length > 0 && (
          <div className="border-primary bg-primary/5 ml-4 flex items-center gap-2 rounded-md border px-3 py-2">
            <span className="text-sm font-medium">
              {selectedLeads.length} selected
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkEditOpen(true)}
              >
                <IconEdit className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkAssignOpen(true)}
              >
                <IconUserShare className="mr-1 h-4 w-4" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <IconTrash className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedLeadIds={selectedLeads}
        onSuccess={() => setSelectedLeads([])}
      />

      <BulkAssignDialog
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        selectedLeadIds={selectedLeads}
        onSuccess={() => setSelectedLeads([])}
      />
    </>
  );
}

interface LeadCheckboxCellProps {
  leadId: string;
  selectedLeads: string[];
  onSelectionChange: (leadIds: string[]) => void;
}

export function LeadCheckboxCell({
  leadId,
  selectedLeads,
  onSelectionChange,
}: LeadCheckboxCellProps) {
  const isSelected = selectedLeads.includes(leadId);

  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={(checked) => {
        if (checked) {
          onSelectionChange([...selectedLeads, leadId]);
        } else {
          onSelectionChange(selectedLeads.filter((id) => id !== leadId));
        }
      }}
    />
  );
}
