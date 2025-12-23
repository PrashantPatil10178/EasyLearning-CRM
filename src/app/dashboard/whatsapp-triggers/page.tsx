"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { Loader2 } from "lucide-react";

const STATUSES = ["new", "contacted", "follow_up", "interested", "won", "lost"];

interface TriggerState {
  status: string;
  isEnabled: boolean;
  campaignName: string;
  source: string;
  templateParamsJson: string;
  paramsFallbackJson: string;
}

export default function WhatsAppTriggersPage() {
  const utils = api.useUtils();
  const [triggers, setTriggers] = useState<Record<string, TriggerState>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: existingTriggers, isLoading } =
    api.whatsapp.getTriggers.useQuery();

  const upsertMutation = api.whatsapp.upsertTrigger.useMutation();

  useEffect(() => {
    if (existingTriggers) {
      const initialTriggers: Record<string, TriggerState> = {};

      // Initialize all statuses with defaults or existing values
      STATUSES.forEach((status) => {
        const existing = existingTriggers.find((t) => t.status === status);
        initialTriggers[status] = {
          status,
          isEnabled: existing?.isEnabled ?? false,
          campaignName: existing?.campaignName ?? `crm_${status}`,
          source: existing?.source ?? "CRM",
          templateParamsJson: existing?.templateParamsJson ?? "[]",
          paramsFallbackJson: existing?.paramsFallbackJson ?? "{}",
        };
      });

      setTriggers(initialTriggers);
    }
  }, [existingTriggers]);

  const handleChange = (
    status: string,
    field: keyof TriggerState,
    value: any,
  ) => {
    setTriggers((prev) => {
      const currentTrigger = prev[status];
      if (!currentTrigger) return prev;

      return {
        ...prev,
        [status]: {
          ...currentTrigger,
          [field]: value,
        } as TriggerState,
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    let hasError = false;

    try {
      // Validate JSON before saving
      for (const status of STATUSES) {
        const t = triggers[status];
        if (!t) continue;

        try {
          JSON.parse(t.templateParamsJson);
        } catch (e) {
          toast.error(`Invalid JSON in Template Params for status: ${status}`);
          hasError = true;
        }
        try {
          JSON.parse(t.paramsFallbackJson);
        } catch (e) {
          toast.error(`Invalid JSON in Fallback for status: ${status}`);
          hasError = true;
        }
      }

      if (hasError) {
        setIsSaving(false);
        return;
      }

      // Save all triggers
      await Promise.all(
        STATUSES.map((status) => {
          const trigger = triggers[status];
          if (!trigger) return Promise.resolve();
          return upsertMutation.mutateAsync(trigger);
        }),
      );

      toast.success("WhatsApp triggers saved successfully");
      utils.whatsapp.getTriggers.invalidate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save triggers");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Triggers (AiSensy)</CardTitle>
            <CardDescription>
              Enable/disable auto WhatsApp on lead status change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground mb-4 text-sm">
              Allowed placeholders in Template Params:{" "}
              <span className="font-semibold">{"{{lead_name}}"}</span>,{" "}
              <span className="font-semibold">{"{{lead_phone}}"}</span>,{" "}
              <span className="font-semibold">{"{{lead_email}}"}</span>,{" "}
              <span className="font-semibold">{"{{lead_status}}"}</span>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[80px]">Enabled</TableHead>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead className="w-[100px]">Source</TableHead>
                    <TableHead>Template Params (JSON Array)</TableHead>
                    <TableHead>Fallback (JSON Object)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STATUSES.map((status) => {
                    const trigger = triggers[status];
                    if (!trigger) return null;

                    return (
                      <TableRow key={status}>
                        <TableCell className="font-medium capitalize">
                          {status.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={trigger.isEnabled}
                            onCheckedChange={(checked) =>
                              handleChange(status, "isEnabled", checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={trigger.campaignName}
                            onChange={(e) =>
                              handleChange(
                                status,
                                "campaignName",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={trigger.source}
                            onChange={(e) =>
                              handleChange(status, "source", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={trigger.templateParamsJson}
                            onChange={(e) =>
                              handleChange(
                                status,
                                "templateParamsJson",
                                e.target.value,
                              )
                            }
                            className="font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={trigger.paramsFallbackJson}
                            onChange={(e) =>
                              handleChange(
                                status,
                                "paramsFallbackJson",
                                e.target.value,
                              )
                            }
                            className="font-mono text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Triggers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
