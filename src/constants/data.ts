import type { NavItem } from "@/types";

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
// Agent Navigation
export const agentNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: "dashboard",
    isActive: false,
    shortcut: ["d", "d"],
    items: [],
  },
  {
    title: "Leads",
    url: "/dashboard/leads",
    icon: "users",
    shortcut: ["l", "l"],
    isActive: false,
    items: [],
  },
  {
    title: "Campaigns",
    url: "/dashboard/campaigns",
    icon: "megaphone",
    shortcut: ["c", "m"],
    isActive: false,
    items: [],
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: "checkSquare",
    shortcut: ["t", "t"],
    isActive: false,
    items: [],
  },
  {
    title: "Calls",
    url: "/dashboard/calls",
    icon: "phone",
    shortcut: ["c", "c"],
    isActive: false,
    items: [],
  },
  {
    title: "CallerDesk Logs",
    url: "/dashboard/call-logs",
    icon: "phoneCall",
    shortcut: ["c", "l"],
    isActive: false,
    items: [],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: "barChart",
    shortcut: ["r", "r"],
    isActive: false,
    items: [],
  },
  {
    title: "Settings",
    url: "#",
    icon: "settings",
    isActive: true,
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: "userPen",
        shortcut: ["m", "m"],
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: "users",
        shortcut: ["u", "u"],
      },
    ],
  },
];

// Manager Navigation
export const managerNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: "dashboard",
    isActive: false,
    shortcut: ["d", "d"],
    items: [],
  },
  {
    title: "Leads",
    url: "/dashboard/leads",
    icon: "users",
    shortcut: ["l", "l"],
    isActive: false,
    items: [],
  },
  {
    title: "Campaigns",
    url: "/dashboard/campaigns",
    icon: "megaphone",
    shortcut: ["c", "m"],
    isActive: false,
    items: [],
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: "checkSquare",
    shortcut: ["t", "t"],
    isActive: false,
    items: [],
  },
  {
    title: "Calls",
    url: "/dashboard/calls",
    icon: "phone",
    shortcut: ["c", "c"],
    isActive: false,
    items: [],
  },
  {
    title: "CallerDesk Logs",
    url: "/dashboard/call-logs",
    icon: "phoneCall",
    shortcut: ["c", "l"],
    isActive: false,
    items: [],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: "barChart",
    shortcut: ["r", "r"],
    isActive: false,
    items: [],
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: "usersGroup",
    shortcut: ["t", "e"],
    isActive: false,
    items: [],
  },
  {
    title: "Integrations",
    url: "/dashboard/integrations",
    icon: "plug",
    shortcut: ["i", "n"],
    isActive: false,
    items: [],
  },
  {
    title: "Settings",
    url: "#",
    icon: "settings",
    isActive: true,
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: "userPen",
        shortcut: ["m", "m"],
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: "users",
        shortcut: ["u", "u"],
      },
      {
        title: "Webhooks",
        url: "/dashboard/webhooks",
        icon: "webhook",
        shortcut: ["w", "h"],
      },
      {
        title: "Auto-Assignment",
        url: "/dashboard/auto-assign",
        icon: "usersGroup",
        shortcut: ["a", "a"],
      },
      {
        title: "Lead Fields",
        url: "/dashboard/workspace-settings",
        icon: "settings",
        shortcut: ["w", "f"],
      },
      {
        title: "Settings",
        shortcut: ["s", "s"],
        url: "/dashboard/settings",
        icon: "settings",
      },
    ],
  },
];

// Admin Navigation
export const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: "dashboard",
    isActive: false,
    shortcut: ["d", "d"],
    items: [],
  },
  {
    title: "Leads",
    url: "/dashboard/leads",
    icon: "users",
    shortcut: ["l", "l"],
    isActive: false,
    items: [],
  },
  {
    title: "Campaigns",
    url: "/dashboard/campaigns",
    icon: "megaphone",
    shortcut: ["c", "m"],
    isActive: false,
    items: [],
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: "checkSquare",
    shortcut: ["t", "t"],
    isActive: false,
    items: [],
  },
  {
    title: "Calls",
    url: "/dashboard/calls",
    icon: "phone",
    shortcut: ["c", "c"],
    isActive: false,
    items: [],
  },
  {
    title: "CallerDesk Logs",
    url: "/dashboard/call-logs",
    icon: "phoneCall",
    shortcut: ["c", "l"],
    isActive: false,
    items: [],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: "barChart",
    shortcut: ["r", "r"],
    isActive: false,
    items: [],
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: "usersGroup",
    shortcut: ["t", "e"],
    isActive: false,
    items: [],
  },
  {
    title: "Integrations",
    url: "/dashboard/integrations",
    icon: "plug",
    shortcut: ["i", "n"],
    isActive: false,
    items: [],
  },
  {
    title: "Workspace Setting",
    url: "#",
    icon: "settings",
    isActive: true,
    items: [
      {
        title: "Webhooks",
        url: "/dashboard/webhooks",
        icon: "webhook",
        shortcut: ["w", "h"],
      },
      {
        title: "Auto-Assignment",
        url: "/dashboard/auto-assign",
        icon: "usersGroup",
        shortcut: ["a", "a"],
      },
      {
        title: "Lead Fields",
        url: "/dashboard/workspace-settings",
        icon: "settings",
        shortcut: ["w", "f"],
      },
    ],
  },
  {
    title: "WhatsApp Triggers",
    url: "/dashboard/whatsapp-triggers",
    icon: "message",
    shortcut: ["w", "t"],
    isActive: false,
    items: [],
  },
  {
    title: "Settings",
    url: "#",
    icon: "settings",
    isActive: true,
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: "userPen",
        shortcut: ["m", "m"],
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: "users",
        shortcut: ["u", "u"],
      },
      {
        title: "Settings",
        shortcut: ["s", "s"],
        url: "/dashboard/settings",
        icon: "settings",
      },
    ],
  },
];

// Helper function to get navigation items based on role
export function getNavItemsByRole(
  role: "AGENT" | "MANAGER" | "ADMIN" | "VIEWER" | "SUPER_ADMIN" | string,
): NavItem[] {
  switch (role) {
    case "AGENT":
    case "VIEWER":
      return agentNavItems;
    case "MANAGER":
      return managerNavItems;
    case "ADMIN":
    case "SUPER_ADMIN":
      return adminNavItems;
    default:
      return agentNavItems;
  }
}

// Keep the old navItems for backward compatibility (defaults to admin)
export const navItems: NavItem[] = adminNavItems;

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "+$1,999.00",
    image: "https://api.slingacademy.com/public/sample-users/1.png",
    initials: "OM",
  },
  {
    id: 2,
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "+$39.00",
    image: "https://api.slingacademy.com/public/sample-users/2.png",
    initials: "JL",
  },
  {
    id: 3,
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "+$299.00",
    image: "https://api.slingacademy.com/public/sample-users/3.png",
    initials: "IN",
  },
  {
    id: 4,
    name: "William Kim",
    email: "will@email.com",
    amount: "+$99.00",
    image: "https://api.slingacademy.com/public/sample-users/4.png",
    initials: "WK",
  },
  {
    id: 5,
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    amount: "+$39.00",
    image: "https://api.slingacademy.com/public/sample-users/5.png",
    initials: "SD",
  },
];
