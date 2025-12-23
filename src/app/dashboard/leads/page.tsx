"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconPlus,
  IconPhone,
  IconMail,
  IconCalendar,
  IconSearch,
  IconFilter,
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconUsers,
  IconMessage,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconUserPlus,
  IconUserCheck,
  IconTrendingUp,
  IconPhoneCall,
} from "@tabler/icons-react";
import Link from "next/link";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";
import { LeadStatusUpdateDialog } from "@/components/leads/lead-status-update-dialog";
import { toast } from "sonner";

const priorityStyles: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONTACTED:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  INTERESTED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  NOT_INTERESTED:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  FOLLOW_UP:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  QUALIFIED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  NEGOTIATION:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  CONVERTED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DONE: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);
  const [statusUpdateLead, setStatusUpdateLead] = useState<any>(null);

  const limit = 15;

  // Fetch leads with filters
  const { data, isLoading, refetch } = api.lead.getAll.useQuery({
    page,
    limit,
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
  });

  // Fetch stats
  const { data: stats } = api.lead.getStats.useQuery();

  // Delete mutation
  const deleteMutation = api.lead.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      refetch();
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const leads = data?.leads || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteMutation.mutate({ id });
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCallViaCallerDesk = async (lead: any) => {
    setCallingLeadId(lead.id);
    try {
      const response = await fetch("/api/callerdesk/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          phone: lead.phone,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // Open status update dialog after successful call
        setStatusUpdateLead(lead);
        toast.success("CallerDesk call initiated!");
      } else {
        toast.error(data.error || "Failed to initiate call");
      }
    } catch (error) {
      toast.error("Failed to connect to CallerDesk");
    } finally {
      setCallingLeadId(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSourceFilter("all");
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    sourceFilter !== "all" ||
    searchQuery;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Leads
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage and track your sales leads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ImportLeadsDialog />
            <LeadFormDialog />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Total Leads
                  </p>
                  <p className="mt-1 text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <IconUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    New
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats?.newLeads || 0}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <IconUserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Contacted
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats?.contacted || 0}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <IconPhoneCall className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Qualified
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats?.qualified || 0}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <IconUserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Converted
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats?.converted || 0}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <IconTrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-white/80">Conv. Rate</p>
              <p className="mt-1 text-2xl font-bold">
                {stats?.conversionRate || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search leads..."
                    className="pl-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <IconFilter className="h-4 w-4" />
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={clearFilters}
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {showFilters && (
                <div className="grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                        <SelectItem value="INTERESTED">Interested</SelectItem>
                        <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                        <SelectItem value="CONVERTED">Converted</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={priorityFilter}
                      onValueChange={setPriorityFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Source</label>
                    <Select
                      value={sourceFilter}
                      onValueChange={setSourceFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="WEBSITE">Website</SelectItem>
                        <SelectItem value="REFERRAL">Referral</SelectItem>
                        <SelectItem value="SOCIAL_MEDIA">
                          Social Media
                        </SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PHONE">Phone</SelectItem>
                        <SelectItem value="WALK_IN">Walk In</SelectItem>
                        <SelectItem value="ADVERTISEMENT">
                          Advertisement
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="bg-muted/50 sticky left-0 z-10 min-w-[200px] font-semibold">
                      Lead
                    </TableHead>
                    <TableHead className="min-w-[180px] font-semibold">
                      Contact
                    </TableHead>
                    <TableHead className="hidden min-w-[120px] font-semibold lg:table-cell">
                      Source
                    </TableHead>
                    <TableHead className="min-w-[120px] font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="hidden min-w-[100px] font-semibold md:table-cell">
                      Priority
                    </TableHead>
                    <TableHead className="hidden min-w-[120px] font-semibold xl:table-cell">
                      Owner
                    </TableHead>
                    <TableHead className="hidden min-w-[120px] font-semibold xl:table-cell">
                      Follow-up
                    </TableHead>
                    <TableHead className="bg-muted/50 sticky right-0 z-10 w-[100px] text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-[400px] text-center">
                        <div className="flex flex-col items-center justify-center">
                          <IconUsers className="text-muted-foreground mb-4 h-12 w-12" />
                          <h3 className="text-lg font-semibold">
                            No leads found
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {hasActiveFilters
                              ? "Try adjusting your filters"
                              : "Add your first lead to get started"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead: any) => (
                      <TableRow
                        key={lead.id}
                        className="group hover:bg-muted/50 cursor-pointer"
                      >
                        <TableCell className="group-hover:bg-muted/50 sticky left-0 z-10 bg-white dark:bg-gray-950">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
                              {lead.firstName.charAt(0)}
                              {lead.lastName?.charAt(0) ?? ""}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/dashboard/leads/${lead.id}`}
                                className="hover:text-primary block truncate text-sm font-medium hover:underline sm:text-base"
                              >
                                {lead.firstName} {lead.lastName}
                              </Link>
                              {lead.city && (
                                <p className="text-muted-foreground truncate text-xs sm:text-sm">
                                  {lead.city}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ContextMenu>
                            <ContextMenuTrigger>
                              <div className="flex flex-col gap-1">
                                <span className="flex cursor-context-menu items-center gap-1.5 text-xs sm:text-sm">
                                  <IconPhone className="h-3 w-3 shrink-0 text-green-600 sm:h-3.5 sm:w-3.5" />
                                  <span className="truncate">{lead.phone}</span>
                                </span>
                                {lead.email && (
                                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                                    <IconMail className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                                    <span className="max-w-[120px] truncate sm:max-w-[150px]">
                                      {lead.email}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() => handleCallViaCallerDesk(lead)}
                                disabled={callingLeadId === lead.id}
                              >
                                <IconPhoneCall className="mr-2 h-4 w-4" />
                                {callingLeadId === lead.id
                                  ? "Calling..."
                                  : "Call via CallerDesk"}
                              </ContextMenuItem>
                              <ContextMenuItem asChild>
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="flex items-center"
                                >
                                  <IconPhone className="mr-2 h-4 w-4" />
                                  Manual Call
                                </a>
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                onClick={() =>
                                  navigator.clipboard.writeText(lead.phone)
                                }
                              >
                                <IconPhone className="mr-2 h-4 w-4" />
                                Copy Phone Number
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal whitespace-nowrap"
                          >
                            {lead.source.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs font-normal whitespace-nowrap ${statusStyles[lead.status] || ""}`}
                          >
                            {lead.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            className={`text-xs font-normal whitespace-nowrap ${priorityStyles[lead.priority] || ""}`}
                          >
                            {lead.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {lead.owner ? (
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                {lead.owner.name?.charAt(0) ?? "?"}
                              </div>
                              <span className="truncate text-sm">
                                {lead.owner.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {lead.nextFollowUp ? (
                            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                              <IconCalendar className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                              {new Date(lead.nextFollowUp).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short" },
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="group-hover:bg-muted/50 sticky right-0 z-10 bg-white text-right dark:bg-gray-950">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
                              onClick={() => handleCallViaCallerDesk(lead)}
                              disabled={callingLeadId === lead.id}
                              title="Call via CallerDesk"
                            >
                              <IconPhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
                              asChild
                              title="Manual Call"
                            >
                              <a href={`tel:${lead.phone}`}>
                                <IconPhone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </a>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
                                >
                                  <IconDotsVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/dashboard/leads/${lead.id}`)
                                  }
                                >
                                  <IconEye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setEditingLead(lead)}
                                >
                                  <IconEdit className="mr-2 h-4 w-4" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(lead.id)}
                                >
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  {deleteConfirm === lead.id
                                    ? "Confirm Delete?"
                                    : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <p className="text-muted-foreground text-center text-xs sm:text-left sm:text-sm">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, total)} of {total} leads
                </p>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="h-8 px-2 sm:px-3"
                  >
                    <IconChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="h-7 w-7 p-0 text-xs sm:h-8 sm:w-8 sm:text-sm"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="h-8 px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <IconChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {editingLead && (
        <EditLeadDialog
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          lead={editingLead}
        />
      )}

      {/* Status Update Dialog - After Call */}
      <LeadStatusUpdateDialog
        open={!!statusUpdateLead}
        onOpenChange={(open) => !open && setStatusUpdateLead(null)}
        lead={statusUpdateLead}
        onSuccess={() => {
          refetch();
          setStatusUpdateLead(null);
        }}
      />
    </PageContainer>
  );
}
