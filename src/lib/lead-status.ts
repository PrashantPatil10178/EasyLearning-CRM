/**
 * Lead Status Hierarchy Configuration
 *
 * This file defines the hierarchical structure of lead statuses:
 * - Fresh: New leads that haven't been contacted
 * - Active: Leads currently being worked on
 * - Closed: Leads that have been resolved (won/lost)
 */

export type LeadCategory = "FRESH" | "ACTIVE" | "CLOSED";

export type LeadStatus =
  // Fresh Category
  | "NEW_LEAD"
  // Active Category
  | "INTERESTED"
  | "JUST_CURIOUS"
  | "FOLLOW_UP"
  | "CONTACTED"
  | "QUALIFIED"
  | "NEGOTIATION"
  // Closed Category
  | "NO_RESPONSE"
  | "NOT_INTERESTED"
  | "CONVERTED"
  | "LOST"
  | "DO_NOT_CONTACT"
  | "WON"
  | "DONE";

export interface StatusOption {
  value: LeadStatus;
  label: string;
  description?: string;
  color: string;
}

export interface CategoryConfig {
  value: LeadCategory;
  label: string;
  description: string;
  color: string;
  statuses: StatusOption[];
}

export const LEAD_STATUS_HIERARCHY: CategoryConfig[] = [
  {
    value: "FRESH",
    label: "Fresh",
    description: "New leads that haven't been contacted yet",
    color: "blue",
    statuses: [
      {
        value: "NEW_LEAD",
        label: "New Lead",
        description: "Brand new lead, no contact made",
        color: "blue",
      },
    ],
  },
  {
    value: "ACTIVE",
    label: "Active",
    description: "Leads currently being worked on",
    color: "green",
    statuses: [
      {
        value: "INTERESTED",
        label: "Interested",
        description: "Lead has shown genuine interest",
        color: "green",
      },
      {
        value: "JUST_CURIOUS",
        label: "Just Curious",
        description: "Lead is exploring options, not committed",
        color: "yellow",
      },
      {
        value: "FOLLOW_UP",
        label: "Follow Up",
        description: "Needs follow-up contact",
        color: "purple",
      },
      {
        value: "CONTACTED",
        label: "Contacted",
        description: "Initial contact has been made",
        color: "cyan",
      },
      {
        value: "QUALIFIED",
        label: "Qualified",
        description: "Lead meets qualification criteria",
        color: "indigo",
      },
      {
        value: "NEGOTIATION",
        label: "Negotiation",
        description: "In pricing/terms negotiation",
        color: "orange",
      },
    ],
  },
  {
    value: "CLOSED",
    label: "Closed",
    description: "Leads that have been resolved",
    color: "gray",
    statuses: [
      {
        value: "NO_RESPONSE",
        label: "No Response",
        description: "Lead did not respond to contact attempts",
        color: "gray",
      },
      {
        value: "NOT_INTERESTED",
        label: "Not Interested",
        description: "Lead declined the offer",
        color: "red",
      },
      {
        value: "CONVERTED",
        label: "Converted",
        description: "Lead successfully converted to customer",
        color: "green",
      },
      {
        value: "LOST",
        label: "Lost",
        description: "Lost to competitor or other reasons",
        color: "red",
      },
      {
        value: "DO_NOT_CONTACT",
        label: "Do Not Contact",
        description: "Lead requested no further contact",
        color: "red",
      },
      {
        value: "WON",
        label: "Won",
        description: "Deal successfully closed",
        color: "green",
      },
      {
        value: "DONE",
        label: "Done",
        description: "Process completed",
        color: "gray",
      },
    ],
  },
];

// Helper function to get category from status
export function getCategoryFromStatus(status: LeadStatus): LeadCategory {
  for (const category of LEAD_STATUS_HIERARCHY) {
    if (category.statuses.some((s) => s.value === status)) {
      return category.value;
    }
  }
  return "FRESH"; // Default fallback
}

// Helper function to get status config
export function getStatusConfig(status: LeadStatus): StatusOption | undefined {
  for (const category of LEAD_STATUS_HIERARCHY) {
    const statusConfig = category.statuses.find((s) => s.value === status);
    if (statusConfig) return statusConfig;
  }
  return undefined;
}

// Helper function to get category config
export function getCategoryConfig(
  category: LeadCategory,
): CategoryConfig | undefined {
  return LEAD_STATUS_HIERARCHY.find((c) => c.value === category);
}

// Flat list of all statuses for dropdowns
export const ALL_LEAD_STATUSES: StatusOption[] = LEAD_STATUS_HIERARCHY.flatMap(
  (category) => category.statuses,
);

// Status styles for Tailwind
export const statusStyles: Record<LeadStatus, string> = {
  // Fresh
  NEW_LEAD: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",

  // Active
  INTERESTED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  JUST_CURIOUS:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  FOLLOW_UP:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  CONTACTED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  QUALIFIED:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  NEGOTIATION:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",

  // Closed
  NO_RESPONSE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  NOT_INTERESTED:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CONVERTED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DO_NOT_CONTACT:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DONE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// Category styles for Tailwind
export const categoryStyles: Record<LeadCategory, string> = {
  FRESH:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  ACTIVE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  CLOSED:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
};

// Status display names (formatted for UI)
export const statusDisplayNames: Record<LeadStatus, string> = {
  NEW_LEAD: "New Lead",
  INTERESTED: "Interested",
  JUST_CURIOUS: "Just Curious",
  FOLLOW_UP: "Follow Up",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  NEGOTIATION: "Negotiation",
  NO_RESPONSE: "No Response",
  NOT_INTERESTED: "Not Interested",
  CONVERTED: "Converted",
  LOST: "Lost",
  DO_NOT_CONTACT: "Do Not Contact",
  WON: "Won",
  DONE: "Done",
};
