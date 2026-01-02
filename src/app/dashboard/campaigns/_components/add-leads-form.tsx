"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddLeadsFormProps {
  campaignId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddLeadsForm({
  campaignId,
  onSuccess,
  onCancel,
}: AddLeadsFormProps) {
  const [source, setSource] = useState("");
  const [customSource, setCustomSource] = useState("");

  const { data: uniqueSources, isLoading: isLoadingSources } =
    api.webhook.getUniqueSources.useQuery();

  const addLeadsMutation = api.campaign.addLeadsFromSource.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Successfully added ${data.added} leads from ${source === "OTHER" ? customSource : source}`,
      );
      setSource("");
      setCustomSource("");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add leads");
    },
  });

  const handleAddLeads = () => {
    const finalSource = source === "OTHER" ? customSource : source;
    if (!finalSource) {
      toast.error("Please select or enter a source");
      return;
    }

    addLeadsMutation.mutate({
      campaignId,
      source: finalSource,
    });
  };

  const sources = uniqueSources || [];
  const displaySources = Array.from(new Set([...sources, "OTHER"]));

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="source">Source</Label>
        <Select
          value={source}
          onValueChange={setSource}
          disabled={isLoadingSources}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoadingSources ? "Loading sources..." : "Select source"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {displaySources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {source === "OTHER" && (
        <div className="grid gap-2">
          <Label htmlFor="custom-source">Custom Source</Label>
          <Input
            id="custom-source"
            value={customSource}
            onChange={(e) => setCustomSource(e.target.value)}
            placeholder="Enter custom source"
          />
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleAddLeads} disabled={addLeadsMutation.isPending}>
          {addLeadsMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Add Leads
        </Button>
      </div>
    </div>
  );
}
