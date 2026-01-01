"use client";
import { navItems } from "@/constants/data";
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
} from "kbar";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import RenderResults from "./render-result";
import useThemeSwitching from "./use-theme-switching";
import { api } from "@/trpc/react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "next-auth/react";

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch search results when query changes
  const { data: searchResults } = api.search.globalSearch.useQuery(
    { query: debouncedQuery, limit: 20 },
    {
      enabled: debouncedQuery.length >= 2 && !!session?.user,
      staleTime: 30000, // Cache for 30 seconds
    },
  );

  // Fetch recent leads for empty state
  const { data: recentLeads } = api.search.getRecentLeads.useQuery(
    { limit: 5 },
    {
      enabled: !!session?.user,
      staleTime: 60000, // Cache for 1 minute
    },
  );

  // These action are for the navigation
  const navigationActions = useMemo(() => {
    // Define navigateTo inside the useMemo callback to avoid dependency array issues
    const navigateTo = (url: string) => {
      router.push(url);
    };

    return navItems.flatMap((navItem) => {
      // Only include base action if the navItem has a real URL and is not just a container
      const baseAction =
        navItem.url !== "#"
          ? {
              id: `${navItem.title.toLowerCase()}Action`,
              name: navItem.title,
              shortcut: navItem.shortcut,
              keywords: navItem.title.toLowerCase(),
              section: "Navigation",
              subtitle: `Go to ${navItem.title}`,
              perform: () => navigateTo(navItem.url),
            }
          : null;

      // Map child items into actions
      const childActions =
        navItem.items?.map((childItem) => ({
          id: `${childItem.title.toLowerCase()}Action`,
          name: childItem.title,
          shortcut: childItem.shortcut,
          keywords: childItem.title.toLowerCase(),
          section: navItem.title,
          subtitle: `Go to ${childItem.title}`,
          perform: () => navigateTo(childItem.url),
        })) ?? [];

      // Return only valid actions (ignoring null base actions for containers)
      return baseAction ? [baseAction, ...childActions] : childActions;
    });
  }, [router]);

  // Combine navigation actions with dynamic search results
  const allActions = useMemo(() => {
    const dynamicActions = [];

    // Show recent leads when no search query
    if (!debouncedQuery && recentLeads && recentLeads.length > 0) {
      dynamicActions.push(
        ...recentLeads.map((lead) => ({
          id: `recent-lead-${lead.id}`,
          name: lead.title,
          subtitle: lead.subtitle,
          keywords: `${lead.title} ${lead.subtitle}`.toLowerCase(),
          section: "🕐 Recent Leads",
          perform: () => router.push(lead.url),
          icon: "🕐",
        })),
      );
    }

    if (searchResults) {
      // Add lead results
      if (searchResults.leads.length > 0) {
        dynamicActions.push(
          ...searchResults.leads.map((lead) => ({
            id: `lead-${lead.id}`,
            name: lead.title,
            subtitle: `${lead.subtitle} • ${lead.status}`,
            keywords: `${lead.title} ${lead.subtitle}`.toLowerCase(),
            section: "👤 Leads",
            perform: () => router.push(lead.url),
            icon: "👤",
          })),
        );
      }

      // Add user results
      if (searchResults.users.length > 0) {
        dynamicActions.push(
          ...searchResults.users.map((user) => ({
            id: `user-${user.id}`,
            name: user.title,
            subtitle: `${user.subtitle} • ${user.role}`,
            keywords: `${user.title} ${user.subtitle}`.toLowerCase(),
            section: "👥 Team Members",
            perform: () => router.push(user.url),
            icon: "👥",
          })),
        );
      }

      // Add task results
      if (searchResults.tasks.length > 0) {
        dynamicActions.push(
          ...searchResults.tasks.map((task) => ({
            id: `task-${task.id}`,
            name: task.title,
            subtitle: `${task.subtitle} • ${task.status}`,
            keywords: `${task.title} ${task.subtitle}`.toLowerCase(),
            section: "✓ Tasks",
            perform: () => router.push(task.url),
            icon: "✓",
          })),
        );
      }

      // Add campaign results
      if (searchResults.campaigns.length > 0) {
        dynamicActions.push(
          ...searchResults.campaigns.map((campaign) => ({
            id: `campaign-${campaign.id}`,
            name: campaign.title,
            subtitle: campaign.subtitle,
            keywords: `${campaign.title}`.toLowerCase(),
            section: "📢 Campaigns",
            perform: () => router.push(campaign.url),
            icon: "📢",
          })),
        );
      }

      // Add course results
      if (searchResults.courses.length > 0) {
        dynamicActions.push(
          ...searchResults.courses.map((course) => ({
            id: `course-${course.id}`,
            name: course.title,
            subtitle: course.subtitle,
            keywords: `${course.title} ${course.subtitle}`.toLowerCase(),
            section: "📚 Courses",
            perform: () => router.push(course.url),
            icon: "📚",
          })),
        );
      }
    }

    return [...navigationActions, ...dynamicActions];
  }, [navigationActions, searchResults, recentLeads, debouncedQuery, router]);

  return (
    <KBarProvider actions={allActions}>
      <KBarComponent searchQuery={searchQuery} setSearchQuery={setSearchQuery}>
        {children}
      </KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({
  children,
  searchQuery,
  setSearchQuery,
}: {
  children: React.ReactNode;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className="bg-background/80 fixed inset-0 z-[9999] p-0! backdrop-blur-sm">
          <KBarAnimator className="bg-card text-card-foreground relative mt-64! w-full max-w-[700px] -translate-y-12! overflow-hidden rounded-lg border shadow-2xl">
            <div className="bg-card border-border sticky top-0 z-10 border-b">
              <KBarSearch
                className="bg-card placeholder:text-muted-foreground w-full border-none px-6 py-5 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden"
                placeholder="Search leads, tasks, users, campaigns..."
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <div className="border-border text-muted-foreground border-t px-6 py-3 text-sm">
                  Type at least 2 characters to search...
                </div>
              )}
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <RenderResults />
            </div>
            <div className="border-border bg-muted/30 border-t px-4 py-3">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <kbd className="bg-background pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                      <span className="text-xs">↑↓</span>
                    </kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="bg-background pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                      <span className="text-xs">↵</span>
                    </kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="bg-background pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                      <span className="text-xs">ESC</span>
                    </kbd>
                    <span>Close</span>
                  </div>
                </div>
                <div className="text-muted-foreground/60">
                  Quick search for everything
                </div>
              </div>
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
