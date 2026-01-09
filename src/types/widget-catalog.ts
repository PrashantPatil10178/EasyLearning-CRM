export type WidgetCategory =
  | "featured"
  | "analytics"
  | "leads"
  | "tasks"
  | "team"
  | "reports";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  icon: string;
  preview?: string;
  component: string;
  defaultConfig?: Record<string, any>;
}

export interface WidgetCatalogCategory {
  id: WidgetCategory;
  name: string;
  icon: string;
}

export const WIDGET_CATEGORIES: WidgetCatalogCategory[] = [
  { id: "featured", name: "Featured", icon: "⭐" },
  { id: "analytics", name: "Analytics", icon: "📊" },
  { id: "leads", name: "Leads", icon: "👥" },
  { id: "tasks", name: "Tasks", icon: "✓" },
  { id: "team", name: "Team", icon: "🤝" },
  { id: "reports", name: "Reports", icon: "📈" },
];

export const WIDGET_CATALOG: WidgetDefinition[] = [
  // Featured
  {
    id: "lead-stats",
    name: "Lead Statistics",
    description: "Overview of total leads, active, and conversion rates",
    category: "featured",
    icon: "📊",
    component: "LeadStatsWidget",
  },
  {
    id: "recent-activities",
    name: "Recent Activities",
    description: "Latest activities and updates across your workspace",
    category: "featured",
    icon: "🔔",
    component: "RecentActivitiesWidget",
  },
  {
    id: "upcoming-followups",
    name: "Upcoming Follow-ups",
    description: "Scheduled follow-ups and tasks for your leads",
    category: "featured",
    icon: "📅",
    component: "UpcomingFollowUpsWidget",
  },

  // Analytics
  {
    id: "lead-source-distribution",
    name: "Lead Source Distribution",
    description: "Pie chart showing where your leads come from",
    category: "analytics",
    icon: "🥧",
    component: "LeadSourceWidget",
  },
  {
    id: "conversion-funnel",
    name: "Conversion Funnel",
    description: "Visualize your lead conversion pipeline",
    category: "analytics",
    icon: "🔄",
    component: "ConversionFunnelWidget",
  },
  {
    id: "revenue-chart",
    name: "Revenue Chart",
    description: "Track revenue trends over time",
    category: "analytics",
    icon: "💰",
    component: "RevenueChartWidget",
  },

  // Leads
  {
    id: "lead-status-breakdown",
    name: "Lead Status Breakdown",
    description: "Distribution of leads by status category",
    category: "leads",
    icon: "🎯",
    component: "LeadStatusWidget",
  },
  {
    id: "new-leads-today",
    name: "New Leads Today",
    description: "List of leads added today",
    category: "leads",
    icon: "✨",
    component: "NewLeadsWidget",
  },
  {
    id: "hot-leads",
    name: "Hot Leads",
    description: "High-priority leads requiring immediate attention",
    category: "leads",
    icon: "🔥",
    component: "HotLeadsWidget",
  },

  // Tasks
  {
    id: "task-overview",
    name: "Task Overview",
    description: "Summary of pending, completed, and overdue tasks",
    category: "tasks",
    icon: "📋",
    component: "TaskOverviewWidget",
  },
  {
    id: "my-tasks",
    name: "My Tasks",
    description: "Your assigned tasks and their status",
    category: "tasks",
    icon: "✓",
    component: "MyTasksWidget",
  },

  // Team
  {
    id: "team-performance",
    name: "Team Performance",
    description: "Track team member productivity and metrics",
    category: "team",
    icon: "🏆",
    component: "TeamPerformanceWidget",
  },
  {
    id: "leaderboard",
    name: "Leaderboard",
    description: "Top performers based on leads closed",
    category: "team",
    icon: "🥇",
    component: "LeaderboardWidget",
  },

  // Reports
  {
    id: "monthly-summary",
    name: "Monthly Summary",
    description: "Key metrics for the current month",
    category: "reports",
    icon: "📊",
    component: "MonthlySummaryWidget",
  },
  {
    id: "campaign-performance",
    name: "Campaign Performance",
    description: "Track marketing campaign effectiveness",
    category: "reports",
    icon: "📢",
    component: "CampaignPerformanceWidget",
  },
];
