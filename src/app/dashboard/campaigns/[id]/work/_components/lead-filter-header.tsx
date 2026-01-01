"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LeadType = "NEW" | "ACTIVE";
type ViewMode = "list" | "details";

interface LeadFilterHeaderProps {
  viewMode: ViewMode;
  leadType: LeadType;
  setLeadType: (type: LeadType) => void;
  newLeadsCount: number;
  activeLeadsCount: number;
  totalLeadsCount: number;
}

export function LeadFilterHeader({
  viewMode,
  leadType,
  setLeadType,
  newLeadsCount,
  activeLeadsCount,
  totalLeadsCount,
}: LeadFilterHeaderProps) {
  if (
    viewMode !== "list" &&
    typeof window !== "undefined" &&
    window.innerWidth < 768
  ) {
    return null;
  }

  return (
    <div className="bg-card border-b p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={leadType}
          onValueChange={(v) => setLeadType(v as LeadType)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid h-11 w-full grid-cols-2 sm:w-auto">
            <TabsTrigger
              value="NEW"
              className="px-3 text-sm font-semibold sm:px-6"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="hidden sm:inline">New</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {newLeadsCount}
                </Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="ACTIVE"
              className="px-3 text-sm font-semibold sm:px-6"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="hidden sm:inline">Active</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeLeadsCount}
                </Badge>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="text-muted-foreground text-sm">
          {totalLeadsCount} leads in {leadType.toLowerCase()}
        </div>
      </div>
    </div>
  );
}
