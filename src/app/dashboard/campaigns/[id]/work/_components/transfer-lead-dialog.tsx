"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ArrowRightLeft } from "lucide-react";

interface TransferLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferToUserId: string;
  setTransferToUserId: (id: string) => void;
  campaign: any;
  selectedLead: any;
  handleTransferLead: () => void;
  transferLeadMutation: any;
}

export function TransferLeadDialog({
  open,
  onOpenChange,
  transferToUserId,
  setTransferToUserId,
  campaign,
  selectedLead,
  handleTransferLead,
  transferLeadMutation,
}: TransferLeadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Lead</DialogTitle>
          <DialogDescription>
            Transfer this lead to another team member. They will receive full
            ownership and responsibility.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="transfer-to">Transfer To</Label>
            <Select
              value={transferToUserId}
              onValueChange={setTransferToUserId}
            >
              <SelectTrigger id="transfer-to">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {/* Show team members if team is assigned, otherwise show campaign members */}
                {campaign?.team && campaign.team.members
                  ? campaign.team.members
                      .filter(
                        (tm: any) =>
                          tm.userId !== (selectedLead as any)?.ownerId,
                      )
                      .map((teamMember: any) => (
                        <SelectItem
                          key={teamMember.userId}
                          value={teamMember.userId}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={teamMember.user.image || undefined}
                              />
                              <AvatarFallback className="text-[10px]">
                                {teamMember.user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{teamMember.user.name}</span>
                          </div>
                        </SelectItem>
                      ))
                  : campaign?.members
                      .filter(
                        (m: any) => m.userId !== (selectedLead as any)?.ownerId,
                      )
                      .map((member: any) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={member.user.image || undefined}
                              />
                              <AvatarFallback className="text-[10px]">
                                {member.user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.user.name}</span>
                          </div>
                        </SelectItem>
                      ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setTransferToUserId("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransferLead}
            disabled={!transferToUserId || transferLeadMutation.isPending}
          >
            {transferLeadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transfer Lead
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
