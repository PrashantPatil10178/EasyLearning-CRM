"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { AddLeadsForm } from "./add-leads-form";

interface AddLeadsBySourceDialogProps {
  campaignId: string;
  onSuccess?: () => void;
}

export function AddLeadsBySourceDialog({
  campaignId,
  onSuccess,
}: AddLeadsBySourceDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Leads by Source
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Leads by Source</DialogTitle>
          <DialogDescription>
            Add all leads from a specific source to this campaign.
          </DialogDescription>
        </DialogHeader>
        <AddLeadsForm
          campaignId={campaignId}
          onSuccess={() => {
            setOpen(false);
            onSuccess?.();
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
