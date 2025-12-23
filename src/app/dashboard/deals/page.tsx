import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  IconPlus,
  IconCurrencyRupee,
  IconTrendingUp,
  IconBriefcase,
  IconChartPie,
  IconCalendar,
  IconUser,
  IconDotsVertical,
  IconGripVertical,
  IconFilter,
} from "@tabler/icons-react";

const stageConfig: Record<
  string,
  {
    label: string;
    color: string;
    borderColor: string;
    bgColor: string;
    iconBg: string;
  }
> = {
  QUALIFICATION: {
    label: "Qualification",
    color: "text-blue-700 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
    iconBg: "bg-blue-500",
  },
  NEEDS_ANALYSIS: {
    label: "Needs Analysis",
    color: "text-amber-700 dark:text-amber-400",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-50/50 dark:bg-amber-950/20",
    iconBg: "bg-amber-500",
  },
  PROPOSAL: {
    label: "Proposal",
    color: "text-purple-700 dark:text-purple-400",
    borderColor: "border-l-purple-500",
    bgColor: "bg-purple-50/50 dark:bg-purple-950/20",
    iconBg: "bg-purple-500",
  },
  NEGOTIATION: {
    label: "Negotiation",
    color: "text-orange-700 dark:text-orange-400",
    borderColor: "border-l-orange-500",
    bgColor: "bg-orange-50/50 dark:bg-orange-950/20",
    iconBg: "bg-orange-500",
  },
  CLOSED_WON: {
    label: "Closed Won",
    color: "text-green-700 dark:text-green-400",
    borderColor: "border-l-green-500",
    bgColor: "bg-green-50/50 dark:bg-green-950/20",
    iconBg: "bg-green-500",
  },
  CLOSED_LOST: {
    label: "Closed Lost",
    color: "text-red-700 dark:text-red-400",
    borderColor: "border-l-red-500",
    bgColor: "bg-red-50/50 dark:bg-red-950/20",
    iconBg: "bg-red-500",
  },
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Deals Pipeline
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your sales opportunities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <IconFilter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button size="sm">
              <IconPlus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-wrap gap-3">
          <Card className="min-w-[140px] flex-1 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs font-medium">
                Total Deals
              </p>
              <p className="mt-1 text-xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] flex-1 border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs font-medium">
                Pipeline Value
              </p>
              <p className="mt-1 text-xl font-bold">
                ₹{(stats.pipelineValue / 100000).toFixed(1)}L
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] flex-1 border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs font-medium">
                Won This Month
              </p>
              <p className="mt-1 text-xl font-bold text-green-600">
                ₹{(stats.wonThisMonth / 100000).toFixed(1)}L
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-[140px] flex-1 border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs font-medium">
                Win Rate
              </p>
              <p className="mt-1 text-xl font-bold">{stats.winRate}%</p>
              <Progress value={Number(stats.winRate)} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="inline-flex gap-4">
            {dealsByStage.map(({ stage, deals }) => {
              const config = stageConfig[stage] ?? {
                label: stage,
                color: "text-gray-700 dark:text-gray-400",
                borderColor: "border-l-gray-500",
                bgColor: "bg-gray-50/50 dark:bg-gray-950/20",
                iconBg: "bg-gray-500",
              };
              const stageValue = deals.reduce(
                (acc, deal) => acc + (deal.amount ?? 0),
                0,
              );

              return (
                <div
                  key={stage}
                  className="bg-card w-[280px] shrink-0 rounded-xl border shadow-sm"
                >
                  {/* Stage Header */}
                  <div
                    className={`rounded-t-xl border-l-4 ${config.borderColor} ${config.bgColor} p-4`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${config.iconBg}`}
                        />
                        <h3 className={`font-semibold ${config.color}`}>
                          {config.label}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-xs"
                        >
                          {deals.length}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-1 flex items-center text-sm">
                      <IconCurrencyRupee className="mr-0.5 h-3.5 w-3.5" />
                      {stageValue > 0
                        ? `${(stageValue / 1000).toFixed(0)}K`
                        : "₹0"}
                    </p>
                  </div>

                  {/* Deals List */}
                  <div className="max-h-[500px] space-y-3 overflow-y-auto p-3">
                    {deals.length === 0 ? (
                      <div className="border-muted-foreground/20 rounded-lg border-2 border-dashed p-6 text-center">
                        <IconBriefcase className="text-muted-foreground/40 mx-auto h-8 w-8" />
                        <p className="text-muted-foreground mt-2 text-sm">
                          No deals here
                        </p>
                        <Button variant="ghost" size="sm" className="mt-2">
                          <IconPlus className="mr-1 h-3.5 w-3.5" />
                          Add Deal
                        </Button>
                      </div>
                    ) : (
                      deals.map((deal) => (
                        <Card
                          key={deal.id}
                          className="group bg-card hover:border-primary/30 cursor-pointer border transition-all hover:shadow-md"
                        >
                          <CardContent className="p-3">
                            {/* Drag Handle & Title */}
                            <div className="flex items-start gap-2">
                              <IconGripVertical className="text-muted-foreground/40 mt-0.5 h-4 w-4 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-100" />
                              <div className="min-w-0 flex-1">
                                <h4 className="group-hover:text-primary truncate font-medium transition-colors">
                                  {deal.name}
                                </h4>
                                <p className="text-muted-foreground mt-0.5 flex items-center text-sm">
                                  <IconUser className="mr-1 h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    {deal.lead.firstName} {deal.lead.lastName}
                                  </span>
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <IconDotsVertical className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {/* Amount & Date */}
                            <div className="mt-3 flex items-center justify-between">
                              <span className="flex items-center text-sm font-semibold text-green-600">
                                <IconCurrencyRupee className="h-3.5 w-3.5" />
                                {((deal.amount ?? 0) / 1000).toFixed(0)}K
                              </span>
                              {deal.expectedCloseDate && (
                                <span className="text-muted-foreground flex items-center text-xs">
                                  <IconCalendar className="mr-1 h-3 w-3" />
                                  {new Date(
                                    deal.expectedCloseDate,
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              )}
                            </div>

                            {/* Course & Owner */}
                            <div className="mt-2 flex items-center justify-between">
                              {deal.courseName ? (
                                <Badge
                                  variant="outline"
                                  className="h-5 truncate text-xs"
                                >
                                  {deal.courseName}
                                </Badge>
                              ) : (
                                <span />
                              )}
                              {deal.owner && (
                                <div
                                  className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                                  title={deal.owner.name ?? "Assigned"}
                                >
                                  {deal.owner.name?.charAt(0).toUpperCase() ??
                                    "?"}
                                </div>
                              )}
                            </div>

                            {/* Probability Bar */}
                            {deal.probability !== null &&
                              deal.probability > 0 && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Probability
                                    </span>
                                    <span className="font-medium">
                                      {deal.probability}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={deal.probability}
                                    className="mt-1 h-1"
                                  />
                                </div>
                              )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Add Deal Button */}
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary w-full justify-start"
                    >
                      <IconPlus className="mr-2 h-4 w-4" />
                      Add Deal
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
