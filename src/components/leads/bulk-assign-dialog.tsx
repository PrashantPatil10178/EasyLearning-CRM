"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeadIds: string[];
  onSuccess?: () => void;
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  selectedLeadIds,
  onSuccess,
}: BulkAssignDialogProps) {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState<string>("");

  const { data: users } = api.user.getAll.useQuery();

  const bulkAssignMutation = api.lead.bulkAssign.useMutation({
    onSuccess: () => {
      toast.success(`Successfully assigned ${selectedLeadIds.length} leads`);
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async () => {
    if (!ownerId) {
      toast.error("Please select an owner");
      return;
    }

    await bulkAssignMutation.mutateAsync({
      leadIds: selectedLeadIds,
      ownerId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Assign Leads</DialogTitle>
          <DialogDescription>
            Assign {selectedLeadIds.length} selected lead(s) to a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Assign To</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger id="owner">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.name || user.email}</span>
                      <span className="text-muted-foreground text-xs">
                        ({user.role})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={bulkAssignMutation.isPending || !ownerId}
          >
            {bulkAssignMutation.isPending
              ? "Assigning..."
              : `Assign ${selectedLeadIds.length} Leads`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
