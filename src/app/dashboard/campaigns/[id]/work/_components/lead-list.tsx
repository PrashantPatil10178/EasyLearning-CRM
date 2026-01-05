"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Star, Loader2, Target, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeadStatuses } from "@/hooks/use-lead-statuses";

type LeadType = "NEW" | "ACTIVE";
type ViewMode = "list" | "details";

interface LeadListProps {
  viewMode: ViewMode;
  leadType: LeadType;
  filteredLeads: any[];
  visibleLeads: any[];
  visibleLeadsCount: number;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  selectedLeadId: string | null;
  handleLeadClick: (leadId: string) => void;
}

export function LeadList({
  viewMode,
  leadType,
  filteredLeads,
  visibleLeads,
  visibleLeadsCount,
  loadMoreRef,
  selectedLeadId,
  handleLeadClick,
}: LeadListProps) {
  // Fetch custom lead statuses to get colors
  const { allStatuses } = useLeadStatuses();

  // Helper to get status color
  const getStatusColor = (statusName: string) => {
    const status = allStatuses.find((s) => s.value === statusName);
    return status?.color || "#6B7280"; // Default gray if not found
  };

  return (
    <div
      className={cn(
        "w-full flex-shrink-0 border-r transition-all duration-300 md:w-96",
        viewMode === "details" &&
          typeof window !== "undefined" &&
          window.innerWidth < 768
          ? "hidden"
          : "block",
      )}
    >
      <ScrollArea className="bg-background h-[calc(100vh-17vh)]">
        <div className="space-y-1 p-2">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="mb-3 h-12 w-12 opacity-20" />
              <p className="text-muted-foreground">
                No {leadType.toLowerCase()} leads
              </p>
            </div>
          ) : (
            <>
              {visibleLeads.map((cl) => (
                <button
                  key={cl.leadId}
                  onClick={() => handleLeadClick(cl.leadId)}
                  className={cn(
                    "w-full rounded-lg p-3 text-left transition-colors",
                    "hover:bg-accent",
                    selectedLeadId === cl.leadId
                      ? "bg-accent border-primary border-2"
                      : "border border-transparent",
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Agent Name */}
                      {cl.lead.owner && (
                        <div className="mb-1 flex items-center gap-1.5">
                          <Avatar className="h-4 w-4 flex-shrink-0">
                            <AvatarImage
                              src={cl.lead.owner.image || undefined}
                            />
                            <AvatarFallback className="text-[8px]">
                              {cl.lead.owner.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground truncate text-xs">
                            {cl.lead.owner.name}
                          </span>
                        </div>
                      )}
                      <div className="mb-1 flex min-w-0 items-center gap-2">
                        <h3 className="min-w-0 flex-1 truncate font-semibold">
                          {cl.lead.firstName} {cl.lead.lastName}
                        </h3>
                        {cl.lead.priority === "URGENT" && (
                          <Star className="h-4 w-4 flex-shrink-0 fill-red-500 text-red-500" />
                        )}
                      </div>
                      <div className="text-muted-foreground mb-1 flex min-w-0 items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {cl.lead.phone}
                        </span>
                      </div>
                      {(cl.lead as any).courseInterested && (
                        <div className="text-muted-foreground mb-2 flex min-w-0 items-start gap-1 text-xs">
                          <Tag className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span className="line-clamp-2 min-w-0 flex-1 break-words">
                            {(cl.lead as any).courseInterested}
                          </span>
                        </div>
                      )}
                      <Badge
                        className="text-xs font-bold"
                        style={{
                          backgroundColor: `${getStatusColor(cl.lead.status)}20`,
                          color: getStatusColor(cl.lead.status),
                        }}
                      >
                        {cl.lead.status}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
              {/* Load more sentinel */}
              {visibleLeadsCount < filteredLeads.length && (
                <div
                  ref={loadMoreRef}
                  className="flex items-center justify-center py-4"
                >
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                  <span className="text-muted-foreground ml-2 text-sm">
                    Loading more leads...
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
