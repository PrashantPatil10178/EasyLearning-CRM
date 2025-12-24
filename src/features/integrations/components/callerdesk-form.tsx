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
import { useEffect, useState } from "react";
import {
  Loader2,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Users,
  PhoneCall,
  Activity,
  UserPlus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  secretKey: z.string().optional(),
  deskPhone: z.string().min(1, "Deskphone number is required"),
  isEnabled: z.boolean(),
  createIncomingLead: z.boolean(),
  allowBreak: z.boolean(),
});

export function CallerDeskForm() {
  const utils = api.useUtils();
  const [showSecret, setShowSecret] = useState(false);
  const [callerDeskMembers, setCallerDeskMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [memberStats, setMemberStats] = useState({
    total: 0,
    active: 0,
    admin: 0,
    regular: 0,
  });
  const [ivrNumbers, setIvrNumbers] = useState<any[]>([]);
  const [isLoadingIVR, setIsLoadingIVR] = useState(false);

  const { data: integration, isLoading } = api.integration.get.useQuery({
    provider: "CALLERDESK",
  });

  const { data: users } = api.user.getAll.useQuery({});

  const updateMutation = api.integration.update.useMutation({
    onSuccess: () => {
      toast.success("CallerDesk settings updated");
      utils.integration.get.invalidate({ provider: "CALLERDESK" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getMembersMutation = api.integration.getCallerDeskMembers.useMutation({
    onSuccess: (data) => {
      if (data && data.getmember) {
        setCallerDeskMembers(data.getmember);

        // Calculate stats
        const stats = {
          total: data.getmember.length,
          active: data.getmember.filter((m: any) => m.status === "1").length,
          admin: data.getmember.filter((m: any) => m.access === "1").length,
          regular: data.getmember.filter((m: any) => m.access === "2").length,
        };
        setMemberStats(stats);

        toast.success(`Fetched ${stats.total} team members from CallerDesk`);
      }
    },
    onError: (error) => {
      toast.error("Failed to fetch CallerDesk members");
      console.error("Failed to fetch members", error);
    },
  });

  const createUserMutation = api.user.create.useMutation({
    onSuccess: (data) => {
      toast.success("User added to workspace successfully");
      utils.user.getAll.invalidate();
      setAddingMemberId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add user to workspace");
      setAddingMemberId(null);
    },
  });

  const updateUserDeskphoneMutation = api.user.updateDeskphone.useMutation({
    onSuccess: () => {
      toast.success("Deskphone updated successfully");
      utils.user.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update deskphone");
    },
  });

  const getIVRNumbersMutation =
    api.integration.getCallerDeskIVRNumbers.useMutation({
      onSuccess: (data) => {
        if (data && data.getdeskphone) {
          setIvrNumbers(data.getdeskphone);
          toast.success(`Fetched ${data.getdeskphone.length} IVR numbers`);
        }
      },
      onError: (error) => {
        toast.error("Failed to fetch IVR numbers");
      },
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      secretKey: "",
      deskPhone: "",
      isEnabled: true,
      createIncomingLead: true,
      allowBreak: true,
    },
  });

  const apiKey = form.watch("apiKey");
  const secretKey = form.watch("secretKey");

  useEffect(() => {
    if (integration) {
      try {
        const config = JSON.parse(integration.config);
        form.reset({
          apiKey: config.apiKey || "",
          secretKey: config.secretKey || "",
          deskPhone: config.deskPhone || "",
          isEnabled: integration.isEnabled ?? true,
          createIncomingLead: config.createIncomingLead ?? true,
          allowBreak: config.allowBreak ?? true,
        });

        // Fetch members - API key will be fetched from DB on server side
        if (config.apiKey && !config.apiKey.startsWith("*")) {
          // Only fetch if we have a real API key (not masked)
          setIsLoadingMembers(true);
          getMembersMutation.mutate(undefined, {
            onSettled: () => setIsLoadingMembers(false),
          });
        } else if (config.apiKey?.startsWith("*")) {
          // If masked, still try to fetch (server will use DB value)
          setIsLoadingMembers(true);
          getMembersMutation.mutate(undefined, {
            onSettled: () => setIsLoadingMembers(false),
          });
        }
      } catch (e) {
        console.error("Failed to parse integration config", e);
      }
    }
  }, [integration]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate({
      provider: "CALLERDESK",
      config: JSON.stringify({
        apiKey: values.apiKey,
        secretKey: values.secretKey,
        deskPhone: values.deskPhone,
        createIncomingLead: values.createIncomingLead,
        allowBreak: values.allowBreak,
      }),
      isEnabled: values.isEnabled,
    });
  }

  const handleFetchIVR = () => {
    setIsLoadingIVR(true);
    getIVRNumbersMutation.mutate(undefined, {
      onSettled: () => setIsLoadingIVR(false),
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleRefreshMembers = () => {
    setIsLoadingMembers(true);
    getMembersMutation.mutate(undefined, {
      onSettled: () => setIsLoadingMembers(false),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your CallerDesk API Key"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Found in CallerDesk Dashboard → API & Integration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret Key</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showSecret ? "text" : "password"}
                        placeholder="Enter Secret Key (optional)"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    For Basic Auth authentication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deskPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desk Phone *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g., +91xxxxxxxxxx" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleFetchIVR}
                      disabled={isLoadingIVR || !apiKey}
                      title="Fetch IVR Numbers"
                    >
                      {isLoadingIVR ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {ivrNumbers.length > 0 && (
                    <div className="mt-2">
                      <select
                        className="border-input bg-background ring-offset-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      >
                        <option value="">Select an IVR Number</option>
                        {ivrNumbers.map((ivr: any) => (
                          <option key={ivr.deskphone} value={ivr.deskphone}>
                            {ivr.deskphone}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <FormDescription>
                    Phone number for outgoing calls. Fetch from CallerDesk to
                    select.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Webhook URL</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/callerdesk/webhook`}
                  className="bg-muted"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/api/callerdesk/webhook`,
                    )
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                Add this URL in CallerDesk webhook settings
              </FormDescription>
            </FormItem>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Integration Settings</h3>

            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Integration
                    </FormLabel>
                    <FormDescription>
                      Activate CallerDesk integration for your workspace
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
              name="createIncomingLead"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Auto-create Leads
                    </FormLabel>
                    <FormDescription>
                      Automatically create leads for incoming calls
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
              name="allowBreak"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Breaks</FormLabel>
                    <FormDescription>
                      Allow team members to go on break
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
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRefreshMembers}
              disabled={isLoadingMembers || !apiKey}
            >
              {isLoadingMembers ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Fetch Team Data
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Statistics Cards */}
      {callerDeskMembers.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-4 text-lg font-medium">CallerDesk Overview</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Members
                  </CardTitle>
                  <Users className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memberStats.total}</div>
                  <p className="text-muted-foreground text-xs">
                    In your CallerDesk account
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Members
                  </CardTitle>
                  <Activity className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {memberStats.active}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Currently active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Administrators
                  </CardTitle>
                  <Users className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memberStats.admin}</div>
                  <p className="text-muted-foreground text-xs">Admin access</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Regular Members
                  </CardTitle>
                  <PhoneCall className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {memberStats.regular}
                  </div>
                  <p className="text-muted-foreground text-xs">Agent access</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Team Members Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">CallerDesk Team Members</h3>
            <p className="text-muted-foreground text-sm">
              Manage CallerDesk members in your workspace
            </p>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Member Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CRM Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMembers ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground mt-2">
                      Loading team members...
                    </p>
                  </TableCell>
                </TableRow>
              ) : callerDeskMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="text-muted-foreground">
                      <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>No CallerDesk members found</p>
                      <p className="text-xs">
                        Click "Fetch Team Data" to load members
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                callerDeskMembers.map((cdMember: any) => {
                  const existingUser = users?.find(
                    (u) =>
                      u.email?.toLowerCase() ===
                        cdMember.member_email?.toLowerCase() ||
                      u.name?.toLowerCase() ===
                        cdMember.member_name?.toLowerCase(),
                  );

                  return (
                    <TableRow
                      key={cdMember.member_id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                            {cdMember.member_name?.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-medium">
                            {cdMember.member_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {cdMember.member_email || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {cdMember.member_num || "-"}
                      </TableCell>
                      <TableCell>
                        {cdMember.access === "1" ? (
                          <Badge className="bg-purple-100 text-purple-700">
                            Admin
                          </Badge>
                        ) : cdMember.access === "2" ? (
                          <Badge className="bg-blue-100 text-blue-700">
                            Regular
                          </Badge>
                        ) : (
                          <Badge variant="outline">Unknown</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cdMember.status === "1" ? (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">
                              Active
                            </span>
                          </div>
                        ) : cdMember.status === "0" ? (
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600">
                              Inactive
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline">Unknown</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {existingUser ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={existingUser.image || ""} />
                              <AvatarFallback className="text-xs">
                                {existingUser.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              In Workspace
                            </Badge>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Not in workspace
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!existingUser && cdMember.member_email && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={addingMemberId === cdMember.member_id}
                            onClick={() => {
                              setAddingMemberId(cdMember.member_id);
                              createUserMutation.mutate({
                                name: cdMember.member_name || "Unknown",
                                email: cdMember.member_email,
                                password: cdMember.password || "CallerDesk123",
                                phone: cdMember.member_num || undefined,
                                role:
                                  cdMember.access === "1" ? "ADMIN" : "AGENT",
                              });
                            }}
                          >
                            {addingMemberId === cdMember.member_id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="mr-2 h-4 w-4" />
                            )}
                            Add to Workspace
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* User-Deskphone Mapping Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  User Deskphone Mapping
                </CardTitle>
                <CardDescription>
                  Assign CallerDesk IVR numbers to your team members
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchIVR}
                disabled={isLoadingIVR || !apiKey}
              >
                {isLoadingIVR ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Fetch IVR Numbers
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback>
                          {user.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {user.email || user.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        className="border-input bg-background w-48 rounded-md border px-3 py-2 text-sm"
                        value={user.callerDeskPhone || ""}
                        onChange={(e) => {
                          updateUserDeskphoneMutation.mutate({
                            userId: user.id,
                            deskphone: e.target.value || null,
                          });
                        }}
                      >
                        <option value="">No Deskphone Assigned</option>
                        {ivrNumbers.map((ivr: any) => (
                          <option key={ivr.deskphone} value={ivr.deskphone}>
                            {ivr.deskphone}
                          </option>
                        ))}
                      </select>
                      <Badge
                        variant={user.callerDeskPhone ? "default" : "secondary"}
                      >
                        {user.callerDeskPhone ? "Assigned" : "Not Assigned"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No users found in workspace
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
