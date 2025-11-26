import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconPlus, IconCurrencyRupee } from "@tabler/icons-react";

const stageLabels: Record<string, string> = {
  QUALIFICATION: "Qualification",
  NEEDS_ANALYSIS: "Needs Analysis",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

const stageColors: Record<string, string> = {
  QUALIFICATION: "border-blue-500 bg-blue-50 dark:bg-blue-950",
  NEEDS_ANALYSIS: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  PROPOSAL: "border-purple-500 bg-purple-50 dark:bg-purple-950",
  NEGOTIATION: "border-orange-500 bg-orange-50 dark:bg-orange-950",
  CLOSED_WON: "border-green-500 bg-green-50 dark:bg-green-950",
  CLOSED_LOST: "border-red-500 bg-red-50 dark:bg-red-950",
};

export default async function DealsPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  const dealsByStage = await api.deal.getByStage();
  const stats = await api.deal.getStats();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deals Pipeline</h1>
            <p className="text-muted-foreground">
              Track and manage your sales opportunities
            </p>
          </div>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold">
                <IconCurrencyRupee className="h-5 w-5" />
                {(stats.pipelineValue / 100000).toFixed(1)}L
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Won This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-2xl font-bold text-green-600">
                <IconCurrencyRupee className="h-5 w-5" />
                {(stats.wonThisMonth / 100000).toFixed(1)}L
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.winRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {dealsByStage.map(({ stage, deals }) => (
            <div
              key={stage}
              className={`flex min-w-[300px] flex-col rounded-lg border-t-4 ${stageColors[stage]} p-4`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">{stageLabels[stage]}</h3>
                <Badge variant="secondary">{deals.length}</Badge>
              </div>

              <div className="flex flex-col gap-3">
                {deals.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    No deals in this stage
                  </p>
                ) : (
                  deals.map((deal) => (
                    <Card key={deal.id} className="cursor-pointer hover:shadow-md">
                      <CardContent className="p-4">
                        <h4 className="font-medium">{deal.name}</h4>
                        <p className="text-muted-foreground text-sm">
                          {deal.lead.firstName} {deal.lead.lastName}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="flex items-center font-semibold text-green-600">
                            <IconCurrencyRupee className="h-4 w-4" />
                            {(deal.amount / 1000).toFixed(0)}K
                          </span>
                          {deal.owner && (
                            <div className="flex items-center">
                              <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                                {deal.owner.name?.charAt(0) ?? "?"}
                              </div>
                            </div>
                          )}
                        </div>
                        {deal.courseName && (
                          <Badge variant="outline" className="mt-2">
                            {deal.courseName}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
