"use client";

import { useState, useEffect } from "react";
import PageContainer from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Download,
  Filter,
  Loader2,
  PlayCircle,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/trpc/react";

interface CallLog {
  id: string;
  sid_id: string;
  file: string;
  deskphone: string;
  caller_name: string;
  is_contact: number;
  member_name: string;
  caller_num: string;
  coin_deducted: string;
  member_num: string;
  call_date: string;
  startdatetime: string;
  enddatetime: string;
  total_duration: string;
  talk_duration: string;
  ringing_duration: number;
  circle: string | null;
  key_pressed: string;
  block: string;
  callresult: string;
  callstatus: string;
  group_name: string;
  LegA_Picked_time: string;
  LegB_Start_time: string;
  LegB_Picked_time: string;
  Flow_type: string;
  contact_id: string | null;
  Member_type: string;
}

interface CallLogsResponse {
  result: CallLog[];
  current_page: number;
  total: number;
  answered: Array<{ total: string }>;
  voicemail: number;
  noanswer: Array<{ total: string }>;
  answered_total: string;
  noanswer_total: string;
  type: string;
}

export default function CallLogsPage() {
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flowType, setFlowType] = useState("all");
  const [callResult, setCallResult] = useState("all");
  const [callerNum, setCallerNum] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Live calls state
  const [liveCallsCount, setLiveCallsCount] = useState(0);
  const [isLoadingLiveCalls, setIsLoadingLiveCalls] = useState(false);

  // Fetch call logs using tRPC
  const { data, isLoading, refetch } =
    api.integration.getCallerDeskCallLogs.useQuery({
      current_page: currentPage,
      per_page: 25,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      Flow_type: flowType === "all" ? undefined : flowType || undefined,
      callresult: callResult === "all" ? undefined : callResult || undefined,
      caller_num: callerNum || undefined,
    });

  const callLogs = data?.result || [];
  const totalRecords = data?.total || 0;
  const stats = {
    answered: parseInt(data?.answered?.[0]?.total || "0"),
    noanswer: parseInt(data?.noanswer?.[0]?.total || "0"),
    voicemail: data?.voicemail || 0,
  };

  const handleFilter = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFlowType("all");
    setCallResult("all");
    setCallerNum("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCallStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("answer")) {
      return <Badge className="bg-green-500">Answered</Badge>;
    }
    if (
      statusLower.includes("no answer") ||
      statusLower.includes("not connected")
    ) {
      return <Badge variant="destructive">No Answer</Badge>;
    }
    if (statusLower.includes("cancel")) {
      return <Badge variant="secondary">Cancelled</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatDuration = (seconds: string) => {
    const sec = parseInt(seconds);
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalPages = Math.ceil(totalRecords / 25);

  // Fetch live calls from API
  const fetchLiveCalls = async () => {
    try {
      setIsLoadingLiveCalls(true);
      const response = await fetch("/api/callerdesk/live-calls");
      if (response.ok) {
        const data = await response.json();
        setLiveCallsCount(data.totalLiveCalls || 0);
      }
    } catch (error) {
      console.error("Error fetching live calls:", error);
    } finally {
      setIsLoadingLiveCalls(false);
    }
  };

  // Poll live calls every 10 seconds
  useEffect(() => {
    fetchLiveCalls(); // Initial fetch
    const interval = setInterval(fetchLiveCalls, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <PageContainer scrollable>
      <div className="space-y-4 pb-6 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">CallerDesk Logs</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
            View and analyze your CallerDesk call history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Total Calls
              </CardTitle>
              <Phone className="text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl font-bold sm:text-2xl">
                {totalRecords}
              </div>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Answered
              </CardTitle>
              <Phone className="h-3.5 w-3.5 text-green-500 sm:h-4 sm:w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl font-bold text-green-500 sm:text-2xl">
                {stats.answered}
              </div>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Missed
              </CardTitle>
              <Phone className="h-3.5 w-3.5 text-red-500 sm:h-4 sm:w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl font-bold text-red-500 sm:text-2xl">
                {stats.noanswer}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filters
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Filter CallerDesk logs by date, type, and status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm">
                  Start Date
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flow_type" className="text-sm">
                  Call Type
                </Label>
                <Select value={flowType} onValueChange={setFlowType}>
                  <SelectTrigger id="flow_type" className="h-10">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="IVR">Incoming (IVR)</SelectItem>
                    <SelectItem value="WEBOBD">Outgoing (WEBOBD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="call_result" className="text-sm">
                  Status
                </Label>
                <Select value={callResult} onValueChange={setCallResult}>
                  <SelectTrigger id="call_result" className="h-10">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="ANSWER">Answered</SelectItem>
                    <SelectItem value="NO ANSWER">No Answer</SelectItem>
                    <SelectItem value="CLICK TO CALL">Click to Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caller_num" className="text-sm">
                  Caller Number
                </Label>
                <Input
                  id="caller_num"
                  type="text"
                  placeholder="Search by number"
                  value={callerNum}
                  onChange={(e) => setCallerNum(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleFilter}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    Apply Filters
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="block space-y-3 lg:hidden">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="bg-muted h-32 w-full animate-pulse rounded" />
                </CardContent>
              </Card>
            ))
          ) : callLogs.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-8">
                <Phone className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="text-lg font-semibold">
                  No CallerDesk logs found
                </h3>
                <p className="text-muted-foreground mt-1 text-center text-sm">
                  Try adjusting your filters
                </p>
              </CardContent>
            </Card>
          ) : (
            callLogs.map((log: CallLog) => (
              <Card key={log.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            log.Flow_type === "IVR"
                              ? "bg-blue-100 dark:bg-blue-900/30"
                              : "bg-purple-100 dark:bg-purple-900/30"
                          }`}
                        >
                          {log.Flow_type === "IVR" ? (
                            <PhoneIncoming className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <PhoneOutgoing className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">
                              {log.caller_name || "Unknown"}
                            </span>
                            {getCallStatusBadge(log.callresult)}
                          </div>
                          <p className="text-muted-foreground truncate text-sm">
                            {log.caller_num}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Member: {log.member_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{log.member_num}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(log.call_date),
                              "MMM dd, yyyy hh:mm a",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Duration & Type */}
                    <div className="flex items-center justify-between border-t pt-2">
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground text-xs">
                          Duration
                        </p>
                        <p className="text-sm font-medium">
                          {formatDuration(log.total_duration)}
                          <span className="text-muted-foreground ml-1 text-xs">
                            (Talk: {formatDuration(log.talk_duration)})
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {log.Flow_type === "IVR" ? "Incoming" : "Outgoing"}
                        </Badge>
                      </div>
                    </div>

                    {/* Recording Actions */}
                    {log.file && (
                      <div className="flex gap-2 border-t pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(log.file, "_blank")}
                        >
                          <PlayCircle className="mr-1.5 h-4 w-4" />
                          Play
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = log.file;
                            link.download = `call-${log.id}.wav`;
                            link.click();
                          }}
                        >
                          <Download className="mr-1.5 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle>Call History</CardTitle>
            <CardDescription>
              Showing {callLogs.length} of {totalRecords} calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recording</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {isLoading ? "Loading..." : "No CallerDesk logs found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    callLogs.map((log: CallLog) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>
                              {format(new Date(log.call_date), "MMM dd, yyyy")}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {format(new Date(log.call_date), "hh:mm a")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {log.caller_name || "Unknown"}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {log.caller_num}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {log.member_name}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {log.member_num}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.Flow_type === "IVR" ? "Incoming" : "Outgoing"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              Total: {formatDuration(log.total_duration)}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              Talk: {formatDuration(log.talk_duration)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCallStatusBadge(log.callresult)}
                        </TableCell>
                        <TableCell>
                          {log.file && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(log.file, "_blank")}
                              >
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = log.file;
                                  link.download = `call-${log.id}.wav`;
                                  link.click();
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Desktop Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 hidden items-center justify-between lg:flex">
                <div className="text-muted-foreground text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <Card className="lg:hidden">
            <CardContent className="p-3">
              <div className="space-y-3">
                <p className="text-muted-foreground text-center text-xs">
                  Page {currentPage} of {totalPages} ({totalRecords} calls)
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                  <div className="px-3 text-sm font-medium">{currentPage}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="flex-1"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Live Calls Indicator Button */}
      <button
        onClick={fetchLiveCalls}
        disabled={isLoadingLiveCalls}
        className="group fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 sm:right-8 sm:bottom-8 sm:px-5 sm:py-4"
      >
        <div className="relative">
          {liveCallsCount > 0 && (
            <div className="absolute -top-1 -right-1 h-3 w-3 animate-ping rounded-full bg-white opacity-75"></div>
          )}
          <Phone
            className={`h-5 w-5 sm:h-6 sm:w-6 ${
              isLoadingLiveCalls ? "animate-pulse" : ""
            } ${liveCallsCount > 0 ? "animate-bounce" : ""}`}
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium opacity-90">Live Calls</span>
          <span className="text-xl leading-none font-bold sm:text-2xl">
            {liveCallsCount}
          </span>
        </div>
        {liveCallsCount > 0 && (
          <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
        )}
      </button>
    </PageContainer>
  );
}
