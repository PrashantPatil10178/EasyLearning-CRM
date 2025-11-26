import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { IconPlus, IconUsers, IconTarget, IconTrendingUp } from "@tabler/icons-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PAUSED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default async function CampaignsPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  // Check if user has permission
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    return redirect("/dashboard");
  }

  const { campaigns, total } = await api.campaign.getAll({
    limit: 50,
  });

  const stats = await api.campaign.getStats();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground">
              Create and manage marketing campaigns
            </p>
          </div>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <IconTarget className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <IconUsers className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <IconTrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No campaigns created yet. Create your first campaign to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => {
                    const conversionRate = campaign._count.leads > 0
                      ? (campaign.conversions / campaign._count.leads) * 100
                      : 0;
                    
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{campaign.name}</span>
                            {campaign.description && (
                              <p className="text-muted-foreground text-sm truncate max-w-[200px]">
                                {campaign.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[campaign.status] ?? ""}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {campaign.startDate
                              ? new Date(campaign.startDate).toLocaleDateString()
                              : "-"}
                            {campaign.endDate && (
                              <>
                                {" - "}
                                {new Date(campaign.endDate).toLocaleDateString()}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{campaign._count.leads}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{campaign.conversions}</span>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="space-y-1">
                            <Progress value={conversionRate} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {conversionRate.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
