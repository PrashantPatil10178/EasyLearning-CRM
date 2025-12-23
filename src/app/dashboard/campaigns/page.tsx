"use client";

import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import {
  Loader2,
  Plus,
  Search,
  Megaphone,
  Users,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = api.campaign.getAll.useQuery({
    search,
  });
  const campaigns = data?.campaigns;

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground">
              Manage your marketing campaigns and track performance.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        ) : campaigns?.length === 0 ? (
          <Card className="flex h-96 flex-col items-center justify-center text-center">
            <div className="bg-primary/10 rounded-full p-4">
              <Megaphone className="text-primary h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No campaigns found</h3>
            <p className="text-muted-foreground mt-2 mb-4 max-w-sm">
              Get started by creating your first marketing campaign to attract
              students.
            </p>
            <Button asChild>
              <Link href="/dashboard/campaigns/new">Create Campaign</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns?.map((campaign) => (
              <Card
                key={campaign.id}
                className="overflow-hidden transition-all hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        <Link
                          href={`/dashboard/campaigns/${campaign.id}`}
                          className="hover:underline"
                        >
                          {campaign.name}
                        </Link>
                      </CardTitle>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Badge variant="accent" className="capitalize">
                          {campaign.type.toLowerCase()}
                        </Badge>
                        <span>•</span>
                        <span
                          className={
                            campaign.status === "ACTIVE"
                              ? "font-medium text-green-600"
                              : ""
                          }
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Leads
                      </span>
                      <span className="font-semibold">
                        {campaign.totalLeads}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Start Date
                      </span>
                      <span className="font-medium">
                        {campaign.startDate
                          ? format(new Date(campaign.startDate), "MMM d, yyyy")
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
