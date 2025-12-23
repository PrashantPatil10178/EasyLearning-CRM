"use client";

import { useParams, useRouter } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PAUSED:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPLETED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const typeIcons: Record<string, any> = {
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: MessageSquare,
  CALLING: Phone,
  SOCIAL_MEDIA: Users,
  MIXED: Activity,
};

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const { data: campaign, isLoading } = api.campaign.getById.useQuery({
    id: campaignId,
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!campaign) {
    return (
      <PageContainer>
        <div className="flex h-96 flex-col items-center justify-center">
          <XCircle className="text-muted-foreground mb-4 h-16 w-16" />
          <h2 className="text-2xl font-bold">Campaign Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The campaign you're looking for doesn't exist.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/campaigns")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </PageContainer>
    );
  }

  const TypeIcon = typeIcons[campaign.type] || Activity;
  const conversionRate =
    campaign.totalLeads > 0
      ? ((campaign.convertedLeads / campaign.totalLeads) * 100).toFixed(1)
      : 0;
  const budgetUsed =
    campaign.budget && campaign.actualSpend
      ? ((campaign.actualSpend / campaign.budget) * 100).toFixed(1)
      : 0;

  // Lead status distribution
  const leadStatusCounts = campaign.leads.reduce((acc: any, cl: any) => {
    acc[cl.status] = (acc[cl.status] || 0) + 1;
    return acc;
  }, {});

  const pendingLeads = leadStatusCounts.pending || 0;
  const contactedLeads = leadStatusCounts.contacted || 0;
  const convertedLeads = leadStatusCounts.converted || 0;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/campaigns")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {campaign.name}
                </h1>
                <Badge className={statusStyles[campaign.status]}>
                  {campaign.status}
                </Badge>
              </div>
              {campaign.description && (
                <p className="text-muted-foreground mt-1">
                  {campaign.description}
                </p>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href={`/dashboard/campaigns/${campaignId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Campaign
            </Link>
          </Button>
        </div>

        {/* Campaign Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <TypeIcon className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Campaign Type</p>
                  <p className="text-lg font-semibold capitalize">
                    {campaign.type.toLowerCase().replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-500/10 p-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Duration</p>
                  <p className="text-lg font-semibold">
                    {campaign.startDate && campaign.endDate
                      ? `${format(new Date(campaign.startDate), "MMM dd")} - ${format(new Date(campaign.endDate), "MMM dd, yyyy")}`
                      : "Not scheduled"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-500/10 p-2">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Team Members</p>
                  <p className="text-lg font-semibold">
                    {campaign.members.length}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-500/10 p-2">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Created By</p>
                  <p className="text-lg font-semibold">
                    {campaign.createdBy.name || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Target className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.totalLeads}</div>
              <p className="text-muted-foreground text-xs">
                {campaign.leads.length} in campaign
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <CheckCircle2 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaign.convertedLeads}
              </div>
              <div className="flex items-center gap-1">
                <Progress
                  value={Number(conversionRate)}
                  className="h-2 flex-1"
                />
                <span className="text-muted-foreground text-xs">
                  {conversionRate}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{campaign.budget?.toLocaleString() || "0"}
              </div>
              <p className="text-muted-foreground text-xs">
                Spent: ₹{campaign.actualSpend?.toLocaleString() || "0"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-muted-foreground text-xs">Conversion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Lead Status Distribution */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Lead Status Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of leads by their current status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      Pending
                    </span>
                    <span className="font-semibold">{pendingLeads}</span>
                  </div>
                  <Progress
                    value={
                      campaign.leads.length > 0
                        ? (pendingLeads / campaign.leads.length) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      Contacted
                    </span>
                    <span className="font-semibold">{contactedLeads}</span>
                  </div>
                  <Progress
                    value={
                      campaign.leads.length > 0
                        ? (contactedLeads / campaign.leads.length) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Converted
                    </span>
                    <span className="font-semibold">{convertedLeads}</span>
                  </div>
                  <Progress
                    value={
                      campaign.leads.length > 0
                        ? (convertedLeads / campaign.leads.length) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>

              <Separator />

              <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                <span className="text-sm font-medium">Total Leads</span>
                <span className="text-lg font-bold">
                  {campaign.leads.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Budget Analysis
              </CardTitle>
              <CardDescription>
                Campaign spending and budget utilization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Budget Allocated</span>
                    <span className="font-semibold">
                      ₹{campaign.budget?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Amount Spent</span>
                    <span className="font-semibold">
                      ₹{campaign.actualSpend?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <Progress value={Number(budgetUsed)} className="h-2" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Remaining</span>
                    <span className="font-semibold">
                      ₹
                      {(
                        (campaign.budget || 0) - (campaign.actualSpend || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={
                      campaign.budget
                        ? ((campaign.budget - (campaign.actualSpend || 0)) /
                            campaign.budget) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Cost per Lead</p>
                  <p className="mt-1 text-lg font-bold">
                    ₹
                    {campaign.totalLeads > 0
                      ? Math.round(
                          (campaign.actualSpend || 0) / campaign.totalLeads,
                        )
                      : 0}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-xs">Budget Used</p>
                  <p className="mt-1 text-lg font-bold">{budgetUsed}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>People working on this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaign.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>
                        {member.user.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Leads ({campaign.leads.length})
            </CardTitle>
            <CardDescription>
              All leads associated with this campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaign.leads.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                <Target className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No leads in this campaign yet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Lead Status</TableHead>
                      <TableHead>Campaign Status</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.leads.map((cl) => (
                      <TableRow key={cl.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/leads/${cl.lead.id}`}
                            className="hover:underline"
                          >
                            {cl.lead.firstName} {cl.lead.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {cl.lead.phone}
                            </div>
                            {cl.lead.email && (
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {cl.lead.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {cl.lead.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              cl.status === "converted"
                                ? "bg-green-100 text-green-700"
                                : cl.status === "contacted"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {cl.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(cl.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
