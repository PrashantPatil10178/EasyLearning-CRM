"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, PieChart, Users, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Label,
} from "recharts";
import { useMemo } from "react";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CampaignSidebarProps {
  campaign: any;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  newLeadsCount: number;
  activeLeadsCount: number;
  closedLeadsCount: number;
}

export function CampaignSidebar({
  campaign,
  leftPanelOpen,
  setLeftPanelOpen,
  newLeadsCount,
  activeLeadsCount,
  closedLeadsCount,
}: CampaignSidebarProps) {
  // Calculate agent-wise lead distribution
  const agentLeadCounts = useMemo(() => {
    if (!campaign?.leads) return [];

    const countByAgent = new Map<
      string,
      { name: string; count: number; image?: string }
    >();

    campaign.leads.forEach((cl: any) => {
      if (cl.lead?.owner) {
        const ownerId = cl.lead.owner.id;
        const existing = countByAgent.get(ownerId);
        if (existing) {
          existing.count++;
        } else {
          countByAgent.set(ownerId, {
            name: cl.lead.owner.name || "Unknown",
            count: 1,
            image: cl.lead.owner.image,
          });
        }
      }
    });

    return Array.from(countByAgent.values());
  }, [campaign?.leads]);

  // Prepare pie chart colors (use a set of distinct colors)
  const chartColors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#14B8A6", // Teal
  ];

  const pieChartData = agentLeadCounts
    .map((agent, index) => ({
      name: agent.name,
      value: agent.count,
      color: chartColors[index % chartColors.length],
    }))
    .filter((item) => item.value > 0);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color?: string }> = {
      value: { label: "Leads" },
    };
    pieChartData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: "var(--primary)",
      };
    });
    return config as ChartConfig;
  }, [pieChartData]);

  const totalLeads = campaign?.leads?.length || 0;

  return (
    <>
      <div
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-50 h-full w-80 transform flex-col border-r transition-transform duration-300 md:relative md:z-auto md:flex md:translate-x-0",
          leftPanelOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Campaign Header - Fixed */}
          <div className="flex-shrink-0 border-b p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-1 text-lg font-bold">
                  {campaign.name}
                </h2>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                  {campaign.description || "Campaign workspace"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 md:hidden"
                onClick={() => setLeftPanelOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="aspect-square overflow-hidden">
                  <CardContent className="flex h-full items-center justify-center p-2.5">
                    <div className="text-center">
                      <div className="mx-auto mb-1 w-fit rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/20">
                        <Target className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <p className="text-muted-foreground text-[10px] font-medium">
                        Total
                      </p>
                      <p className="text-lg font-bold">
                        {campaign.leads.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="aspect-square overflow-hidden">
                  <CardContent className="flex h-full items-center justify-center p-2.5">
                    <div className="text-center">
                      <div className="mx-auto mb-1 w-fit rounded-full bg-green-100 p-1.5 dark:bg-green-900/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <p className="text-muted-foreground text-[10px] font-medium">
                        Won
                      </p>
                      <p className="text-lg font-bold">
                        {campaign.convertedLeads}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="aspect-square overflow-hidden">
                  <CardContent className="flex h-full items-center justify-center p-2.5">
                    <div className="text-center">
                      <div className="mx-auto mb-1 w-fit rounded-full bg-gray-100 p-1.5 dark:bg-gray-900/20">
                        <X className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                      <p className="text-muted-foreground text-[10px] font-medium">
                        Closed
                      </p>
                      <p className="text-lg font-bold">{closedLeadsCount}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Agent-Wise Lead Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <PieChart className="h-4 w-4" />
                    Agent Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                  {totalLeads > 0 && pieChartData.length > 0 ? (
                    <ChartContainer
                      config={chartConfig}
                      className="mx-auto aspect-square h-[200px]"
                    >
                      <RechartsPieChart>
                        <defs>
                          {pieChartData.map((agent, index) => (
                            <linearGradient
                              key={agent.name}
                              id={`fill${agent.name.replace(/[^a-zA-Z0-9]/g, "")}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--primary)"
                                stopOpacity={1 - index * 0.15}
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--primary)"
                                stopOpacity={0.8 - index * 0.15}
                              />
                            </linearGradient>
                          ))}
                        </defs>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                          data={pieChartData.map((item) => ({
                            ...item,
                            fill: `url(#fill${item.name.replace(/[^a-zA-Z0-9]/g, "")})`,
                          }))}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          strokeWidth={2}
                          stroke="var(--background)"
                        >
                          <Label
                            content={({ viewBox }) => {
                              if (
                                viewBox &&
                                "cx" in viewBox &&
                                "cy" in viewBox
                              ) {
                                return (
                                  <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    <tspan
                                      x={viewBox.cx}
                                      y={viewBox.cy}
                                      className="fill-foreground text-2xl font-bold"
                                    >
                                      {totalLeads.toLocaleString()}
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy || 0) + 20}
                                      className="fill-muted-foreground text-xs"
                                    >
                                      Total Leads
                                    </tspan>
                                  </text>
                                );
                              }
                            }}
                          />
                        </Pie>
                      </RechartsPieChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-muted-foreground py-6 text-center text-xs">
                      No leads assigned yet
                    </p>
                  )}
                  {/* Legend below chart */}
                  {totalLeads > 0 && (
                    <div className="mt-4 max-h-28 space-y-1.5 overflow-y-auto">
                      {pieChartData.map((agent, index) => (
                        <div
                          key={agent.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                              style={{
                                background: `linear-gradient(to bottom, 
                                    hsl(var(--primary) / ${1 - index * 0.15}), 
                                    hsl(var(--primary) / ${0.8 - index * 0.15}))`,
                              }}
                            />
                            <span className="truncate">{agent.name}</span>
                          </span>
                          <span className="ml-2 font-semibold">
                            {agent.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="h-4 w-4" />
                    {campaign.team ? (
                      <span className="truncate">
                        Team: {campaign.team.name}
                      </span>
                    ) : (
                      <>Team Members</>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-28 overflow-y-auto">
                    {campaign.team?.members ? (
                      <div className="space-y-2">
                        {campaign.team.members.map((teamMember: any) => (
                          <div
                            key={teamMember.id}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-7 w-7">
                              <AvatarImage
                                src={teamMember.user.image || undefined}
                              />
                              <AvatarFallback className="text-xs">
                                {teamMember.user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs">
                              {teamMember.user.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {campaign.members.length > 0 ? (
                          campaign.members.map((member: any) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-2"
                            >
                              <Avatar className="h-7 w-7">
                                <AvatarImage
                                  src={member.user.image || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {member.user.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-xs">
                                {member.user.name}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground py-4 text-center text-xs">
                            No team assigned
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Overlay for mobile when left panel is open */}
      {leftPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setLeftPanelOpen(false)}
        />
      )}
    </>
  );
}
