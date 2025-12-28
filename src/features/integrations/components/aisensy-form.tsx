"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useEffect } from "react";
import { Loader2, MessageCircle, Zap } from "lucide-react";

const formSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  baseUrl: z.string().min(1, "Base URL is required"),
  isEnabled: z.boolean(),
});

export function AiSensyForm() {
  const utils = api.useUtils();
  const { data: integration, isLoading } = api.integration.get.useQuery({
    provider: "AISENSY",
  });

  const updateMutation = api.integration.update.useMutation({
    onSuccess: () => {
      toast.success("AiSensy settings updated");
      utils.integration.get.invalidate({ provider: "AISENSY" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      baseUrl: "https://backend.aisensy.com",
      isEnabled: true,
    },
  });

  useEffect(() => {
    if (integration) {
      try {
        const config = JSON.parse(integration.config);
        form.reset({
          apiKey: config.apiKey || "",
          baseUrl: config.baseUrl || "https://backend.aisensy.com",
          isEnabled: integration.isEnabled,
        });
      } catch (e) {
        console.error("Failed to parse integration config", e);
      }
    }
  }, [integration, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate({
      provider: "AISENSY",
      config: JSON.stringify({
        apiKey: values.apiKey,
        baseUrl: values.baseUrl,
      }),
      isEnabled: values.isEnabled,
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* WhatsApp Triggers Info Banner */}
        {form.watch("isEnabled") && (
          <div className="rounded-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/50">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  🎉 WhatsApp Triggers Unlocked!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  With AISensy active, you can now automate WhatsApp messages
                  when lead status changes. Go to{" "}
                  <strong>WhatsApp Triggers</strong> to set up automatic
                  messages for status changes like CONVERTED, FOLLOW_UP_DONE,
                  etc.
                </p>
                <a
                  href="/dashboard/whatsapp-triggers"
                  className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  Configure WhatsApp Triggers →
                </a>
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable AiSensy</FormLabel>
                <FormDescription>
                  Enable or disable AiSensy WhatsApp integration for this
                  workspace.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input placeholder="Enter your AiSensy API Key" {...field} />
              </FormControl>
              <FormDescription>
                You can find this in your AiSensy dashboard under Manage -&gt;
                API Key.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL</FormLabel>
              <FormControl>
                <Input placeholder="https://backend.aisensy.com" {...field} />
              </FormControl>
              <FormDescription>
                The base URL for AiSensy API calls.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
