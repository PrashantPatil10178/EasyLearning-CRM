"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, PieChart, Users, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignSidebarProps {
  campaign: any;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  newLeadsCount: number;
  activeLeadsCount: number;
}

export function CampaignSidebar({
  campaign,
  leftPanelOpen,
  setLeftPanelOpen,
  newLeadsCount,
  activeLeadsCount,
}: CampaignSidebarProps) {
  return (
    <>
      <div
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-50 h-full w-80 transform flex-col border-r transition-transform duration-300 md:relative md:z-auto md:flex md:translate-x-0",
          leftPanelOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full min-h-0 flex-col p-4">
          {/* Campaign Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="line-clamp-1 text-lg font-bold">
                {campaign.name}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setLeftPanelOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {campaign.description || "Campaign workspace"}
            </p>
          </div>

          <Separator className="mb-4" />

          {/* Stats Grid */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Card className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="text-xl font-bold">{campaign.leads.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Converted</p>
                    <p className="text-xl font-bold">
                      {campaign.convertedLeads}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Type Distribution */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <PieChart className="h-4 w-4" />
                Lead Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  New Leads
                </span>
                <span className="font-semibold">{newLeadsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Active Leads
                </span>
                <span className="font-semibold">{activeLeadsCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                {campaign.team ? (
                  <>Team: {campaign.team.name}</>
                ) : (
                  <>Team ({campaign.members.length})</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                {campaign.team && campaign.team.members ? (
                  <div className="space-y-2">
                    {campaign.team.members.map((teamMember: any) => (
                      <div
                        key={teamMember.id}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={teamMember.user.image || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {teamMember.user.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">
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
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {member.user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm">
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
              </ScrollArea>
            </CardContent>
          </Card>
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
