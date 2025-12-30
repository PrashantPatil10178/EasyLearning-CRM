"use client";

import { useState } from "react";
import * as React from "react";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Copy,
  Webhook,
  Shield,
  Activity,
  FileCode,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

export default function WebhooksPage() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [logsPage, setLogsPage] = useState(1);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "firstName",
    "phone",
  ]);
  const [n8nOpen, setN8nOpen] = useState(false);
  const [pabblyOpen, setPabblyOpen] = useState(false);
  const logsPerPage = 10;

  // Get current workspace
  const { data: currentWorkspace } = api.workspace.getCurrent.useQuery() as {
    data:
      | {
          name: string;
          id: string;
          createdAt: Date;
          updatedAt: Date;
          slug: string;
          logo: string | null;
          settings: string | null;
          webhookToken?: string | null;
        }
      | undefined;
  };

  // Set webhook URL on client side
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/lead`);
    }
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const utils = api.useUtils();
  const { data: webhookLogsData } = api.webhook.getRecentLogs.useQuery({
    limit: logsPerPage,
    offset: (logsPage - 1) * logsPerPage,
  });
  const webhookLogs = webhookLogsData?.logs || [];
  const totalLogs = webhookLogsData?.total || 0;
  const totalPages = Math.ceil(totalLogs / logsPerPage);

  const { data: leadFields } = api.webhook.getLeadFields.useQuery();

  const generateWebhookToken = api.workspace.generateWebhookToken.useMutation({
    onSuccess: () => {
      toast.success("Webhook token generated successfully");
      utils.workspace.getCurrent.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const regenerateWebhookToken =
    api.workspace.regenerateWebhookToken.useMutation({
      onSuccess: () => {
        toast.success("Webhook token regenerated. Update your webhooks!");
        utils.workspace.getCurrent.invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Standard fields
  const standardFields = [
    { key: "firstName", label: "First Name", required: true },
    { key: "lastName", label: "Last Name", required: false },
    { key: "email", label: "Email", required: false },
    { key: "phone", label: "Phone", required: true },
    { key: "source", label: "Source", required: false },
    { key: "status", label: "Status", required: false },
    { key: "priority", label: "Priority", required: false },
    { key: "city", label: "City", required: false },
    { key: "state", label: "State", required: false },
    { key: "country", label: "Country", required: false },
    { key: "courseInterested", label: "Course Interested", required: false },
    { key: "tags", label: "Tags", required: false },
    { key: "campaign", label: "Campaign", required: false },
  ];

  const toggleField = (field: string) => {
    if (field === "firstName" || field === "phone") {
      toast.error("This field is required and cannot be deselected");
      return;
    }
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  // Generate sample JSON based on selected fields
  const generateSampleJSON = () => {
    const sample: any = {};

    selectedFields.forEach((field) => {
      const standardField = standardFields.find((f) => f.key === field);
      if (standardField) {
        switch (field) {
          case "firstName":
            sample.firstName = "John";
            break;
          case "lastName":
            sample.lastName = "Doe";
            break;
          case "email":
            sample.email = "john@example.com";
            break;
          case "phone":
            sample.phone = "1234567890";
            break;
          case "source":
            sample.source = "Website";
            break;
          case "status":
            sample.status = "NEW";
            break;
          case "priority":
            sample.priority = "MEDIUM";
            break;
          case "city":
            sample.city = "Mumbai";
            break;
          case "state":
            sample.state = "Maharashtra";
            break;
          case "country":
            sample.country = "India";
            break;
          case "courseInterested":
            sample.courseInterested = "Web Development";
            break;
          case "tags":
            sample.tags = "Premium,Urgent";
            break;
          case "campaign":
            sample.campaign = "Summer Campaign 2025";
            break;
        }
      }
    });

    // Add selected custom fields
    if (leadFields) {
      leadFields.forEach((field: any) => {
        if (selectedFields.includes(field.key)) {
          if (!sample.customFields) {
            sample.customFields = {};
          }
          sample.customFields[field.key] =
            field.type === "NUMBER" ? 0 : "value";
        }
      });
    }

    return JSON.stringify(sample, null, 2);
  };

  // Generate cURL command with minified JSON
  const generateCurlCommand = () => {
    const sample: any = {};

    selectedFields.forEach((field) => {
      const standardField = standardFields.find((f) => f.key === field);
      if (standardField) {
        switch (field) {
          case "firstName":
            sample.firstName = "John";
            break;
          case "lastName":
            sample.lastName = "Doe";
            break;
          case "email":
            sample.email = "john@example.com";
            break;
          case "phone":
            sample.phone = "1234567890";
            break;
          case "source":
            sample.source = "Website";
            break;
          case "status":
            sample.status = "NEW";
            break;
          case "priority":
            sample.priority = "MEDIUM";
            break;
          case "city":
            sample.city = "Mumbai";
            break;
          case "state":
            sample.state = "Maharashtra";
            break;
          case "country":
            sample.country = "India";
            break;
          case "courseInterested":
            sample.courseInterested = "Web Development";
            break;
          case "tags":
            sample.tags = "Premium,Urgent";
            break;
          case "campaign":
            sample.campaign = "Summer Campaign 2025";
            break;
        }
      }
    });

    // Add selected custom fields
    if (leadFields) {
      leadFields.forEach((field: any) => {
        if (selectedFields.includes(field.key)) {
          if (!sample.customFields) {
            sample.customFields = {};
          }
          sample.customFields[field.key] =
            field.type === "NUMBER" ? 0 : "value";
        }
      });
    }

    // Minified JSON (no spaces or newlines)
    const minifiedJson = JSON.stringify(sample);

    return `curl -X POST '${webhookUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-workspace-id: ${currentWorkspace?.id || "YOUR_WORKSPACE_ID"}' \\
  -H 'x-webhook-token: ${currentWorkspace?.webhookToken || "YOUR_WEBHOOK_TOKEN"}' \\
  -d '${minifiedJson}'`;
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-8 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Webhook Configuration
            </h2>
            <p className="text-muted-foreground mt-2">
              Receive leads automatically from external sources like Pabbly,
              n8n, Zapier, Make.com, and more
            </p>
          </div>
        </div>

        {/* Webhook Endpoint Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Webhook className="h-5 w-5" />
              Webhook Endpoint
            </CardTitle>
            <CardDescription>
              Use this webhook URL to receive new leads from automation
              platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
              <Label className="text-sm font-medium">Webhook URL</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="bg-white font-mono text-sm dark:bg-slate-950"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(webhookUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Webhook Token Section */}
            <div className="rounded-lg border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-6 dark:border-yellow-800 dark:from-yellow-950/50 dark:to-amber-950/50">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                      🔐 Webhook Authentication Token
                    </p>
                    <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                      Include this token in the{" "}
                      <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-900">
                        x-webhook-token
                      </code>{" "}
                      header for all webhook requests. Keep it secret!
                    </p>
                  </div>
                  {currentWorkspace?.webhookToken ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900">
                        <code className="font-mono text-xs text-yellow-900 dark:text-yellow-100">
                          {currentWorkspace.webhookToken}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(currentWorkspace.webhookToken!)
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => generateWebhookToken.mutate()}
                      disabled={generateWebhookToken.isPending}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Generate Token
                    </Button>
                  )}
                  {currentWorkspace?.webhookToken && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            "Regenerating will invalidate the old token. All existing webhooks will need to be updated. Continue?",
                          )
                        ) {
                          regenerateWebhookToken.mutate();
                        }
                      }}
                      disabled={regenerateWebhookToken.isPending}
                    >
                      Regenerate Token
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                <h3 className="mb-3 font-medium">Required Headers</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">x-workspace-id</Badge>
                      <span className="text-muted-foreground text-sm">
                        {currentWorkspace?.id || "Your workspace ID"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() =>
                        copyToClipboard(currentWorkspace?.id || "")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">x-webhook-token</Badge>
                      <span className="text-muted-foreground text-sm">
                        {currentWorkspace?.webhookToken
                          ? "Your webhook token"
                          : "Generate token first"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Content-Type</Badge>
                      <span className="text-muted-foreground text-sm">
                        application/json
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                <h3 className="mb-3 font-medium">Required Fields</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge>firstName</Badge>
                      <span className="text-muted-foreground text-sm">
                        Lead's first name
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge>phone</Badge>
                      <span className="text-muted-foreground text-sm">
                        Lead's phone number
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Field Selector Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileCode className="h-5 w-5" />
              Select Fields to Send
            </CardTitle>
            <CardDescription>
              Choose which fields you want to send in your webhook payload.
              Generate sample JSON and cURL command.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 font-medium">Standard Fields</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {standardFields.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => toggleField(field.key)}
                        disabled={field.required}
                      />
                      <Label
                        htmlFor={field.key}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {leadFields && leadFields.length > 0 && (
                <div>
                  <h3 className="mb-3 font-medium">Custom Fields</h3>
                  <p className="text-muted-foreground mb-3 text-xs">
                    These fields are defined in your workspace settings
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {leadFields.map((field: any) => (
                      <div
                        key={field.key}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`custom-${field.key}`}
                          checked={selectedFields.includes(field.key)}
                          onCheckedChange={() => toggleField(field.key)}
                        />
                        <Label
                          htmlFor={`custom-${field.key}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {field.name}
                          {field.isRequired && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {field.type}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <Tabs defaultValue="json" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="json">Sample JSON</TabsTrigger>
                <TabsTrigger value="curl">cURL Command</TabsTrigger>
              </TabsList>
              <TabsContent value="json" className="space-y-4">
                <div className="rounded-lg bg-slate-950 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Sample Payload
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generateSampleJSON())}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-auto">
                    <pre className="text-xs break-words whitespace-pre-wrap text-green-400">
                      <code>{generateSampleJSON()}</code>
                    </pre>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="curl" className="space-y-4">
                <div className="rounded-lg bg-slate-950 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      cURL Command (Import into n8n/Pabbly)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generateCurlCommand())}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-auto">
                    <pre className="text-xs break-all whitespace-pre-wrap text-green-400">
                      <code className="break-all">{generateCurlCommand()}</code>
                    </pre>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>💡 Tip:</strong> Copy this cURL command and use the
                    "Import cURL" feature in n8n or Pabbly to automatically
                    configure your webhook node.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Integration Guides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ExternalLink className="h-5 w-5" />
              Integration Guides
            </CardTitle>
            <CardDescription>
              Step-by-step instructions to connect with popular automation tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* n8n Guide */}
            <Collapsible open={n8nOpen} onOpenChange={setN8nOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-slate-50 dark:hover:bg-slate-900">
                <div className="flex items-center gap-3">
                  <Image
                    src="/n8n.png"
                    alt="n8n"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <div className="text-left">
                    <h3 className="font-semibold">n8n Integration</h3>
                    <p className="text-muted-foreground text-sm">
                      Connect your n8n workflows
                    </p>
                  </div>
                </div>
                {n8nOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-4">
                <div className="space-y-4 rounded-lg border p-4">
                  <ol className="list-inside list-decimal space-y-3 text-sm">
                    <li>
                      <strong>Open n8n</strong> and create a new workflow
                    </li>
                    <li>
                      Add an <Badge variant="secondary">HTTP Request</Badge>{" "}
                      node to your workflow
                    </li>
                    <li>
                      <strong>Import cURL:</strong> Click on the HTTP Request
                      node, then click the <Badge>Import from cURL</Badge>{" "}
                      button
                    </li>
                    <li>
                      Paste the cURL command from the "cURL Command" tab above
                    </li>
                    <li>
                      n8n will automatically configure:
                      <ul className="mt-1 ml-6 list-disc space-y-1">
                        <li>POST method</li>
                        <li>Webhook URL</li>
                        <li>
                          Required headers (x-workspace-id, x-webhook-token)
                        </li>
                        <li>Sample JSON body</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Customize</strong> the body data with your actual
                      data sources
                    </li>
                    <li>
                      <strong>Test</strong> the workflow - check the Recent
                      Webhook Activity section below
                    </li>
                    <li>
                      <strong>Activate</strong> the workflow when ready
                    </li>
                  </ol>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Pabbly Guide */}
            <Collapsible open={pabblyOpen} onOpenChange={setPabblyOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-slate-50 dark:hover:bg-slate-900">
                <div className="flex items-center gap-3">
                  <Image
                    src="/pably.png"
                    alt="Pabbly"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <div className="text-left">
                    <h3 className="font-semibold">
                      Pabbly Connect Integration
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Connect your Pabbly workflows
                    </p>
                  </div>
                </div>
                {pabblyOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-4">
                <div className="space-y-4 rounded-lg border p-4">
                  <ol className="list-inside list-decimal space-y-3 text-sm">
                    <li>
                      <strong>Open Pabbly Connect</strong> and create a new
                      workflow
                    </li>
                    <li>
                      Add a trigger (e.g., Google Forms, Facebook Lead Ads,
                      etc.)
                    </li>
                    <li>
                      Add an action step:{" "}
                      <Badge variant="secondary">API by Pabbly</Badge> →{" "}
                      <Badge>POST</Badge>
                    </li>
                    <li>
                      <strong>Import cURL:</strong> Look for the{" "}
                      <Badge>Import cURL</Badge> option in the API action
                    </li>
                    <li>
                      Paste the cURL command from the "cURL Command" tab above
                    </li>
                    <li>
                      Pabbly will automatically fill in:
                      <ul className="mt-1 ml-6 list-disc space-y-1">
                        <li>Request URL</li>
                        <li>Headers section</li>
                        <li>Body parameters</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Map fields</strong> from your trigger to the body
                      parameters
                    </li>
                    <li>
                      <strong>Test</strong> the connection - verify in Recent
                      Webhook Activity below
                    </li>
                    <li>
                      <strong>Save & Activate</strong> the workflow
                    </li>
                  </ol>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Other Platforms */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Other Platforms</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Most automation platforms support cURL import or HTTP/Webhook
                nodes:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>
                  <strong>Zapier:</strong> Use "Webhooks by Zapier" → "POST"
                </li>
                <li>
                  <strong>Make.com:</strong> Use "HTTP" module → "Make a
                  request"
                </li>
                <li>
                  <strong>Integromat:</strong> Use "HTTP" module
                </li>
                <li>
                  <strong>Custom Scripts:</strong> Copy the cURL command above
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Recent Webhook Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5" />
                  Recent Webhook Activity
                </CardTitle>
                <CardDescription>
                  Latest leads received via webhook from various sources.
                  Showing {webhookLogs.length} of {totalLogs} total logs.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {webhookLogs && webhookLogs.length > 0 ? (
              <div className="space-y-3">
                {webhookLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-medium">
                          {log.lead.firstName} {log.lead.lastName}
                        </span>
                        {log.lead.source && (
                          <Badge variant="outline" className="text-xs">
                            {log.lead.source}
                          </Badge>
                        )}
                        {log.lead.status && (
                          <Badge variant="secondary" className="text-xs">
                            {log.lead.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Phone:</span>
                          <span>{log.lead.phone}</span>
                        </div>
                        {log.lead.email && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Email:</span>
                            <span>{log.lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Time:</span>
                          <span>
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsPage(logsPage - 1)}
                      disabled={logsPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                      Page {logsPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsPage(logsPage + 1)}
                      disabled={logsPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Activity className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium">No webhook activity yet</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Webhook activity will appear here once you start receiving
                  leads from your automation platforms.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
