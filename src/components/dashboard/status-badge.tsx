import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const dotStyles: Record<StatusVariant, string> = {
  default: "bg-gray-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
};

// Auto-detect variant based on status string
function getVariantFromStatus(status: string): StatusVariant {
  const s = status.toUpperCase();

  // Success statuses
  if (
    [
      "COMPLETED",
      "CONVERTED",
      "ACTIVE",
      "QUALIFIED",
      "WON",
      "CLOSED_WON",
      "INTERESTED",
    ].includes(s)
  ) {
    return "success";
  }

  // Warning statuses
  if (
    [
      "PENDING",
      "FOLLOW_UP",
      "IN_PROGRESS",
      "PAUSED",
      "CALLBACK_REQUESTED",
      "CALL_BACK_LATER",
      "NO_ANSWER",
    ].includes(s)
  ) {
    return "warning";
  }

  // Error statuses
  if (
    [
      "LOST",
      "CLOSED_LOST",
      "CANCELLED",
      "FAILED",
      "OVERDUE",
      "NOT_INTERESTED",
      "WRONG_NUMBER",
    ].includes(s)
  ) {
    return "error";
  }

  // Info statuses
  if (
    [
      "NEW",
      "CONTACTED",
      "DRAFT",
      "SCHEDULED",
      "OUTBOUND",
      "INBOUND",
      "INFORMATION_SHARED",
    ].includes(s)
  ) {
    return "info";
  }

  // Purple statuses
  if (
    [
      "NEGOTIATION",
      "PROPOSAL",
      "NEEDS_ANALYSIS",
      "QUALIFICATION",
      "VOICEMAIL",
    ].includes(s)
  ) {
    return "purple";
  }

  return "default";
}

export function StatusBadge({
  status,
  variant,
  dot = true,
  className,
}: StatusBadgeProps) {
  const finalVariant = variant ?? getVariantFromStatus(status);
  const displayStatus = status.replace(/_/g, " ");

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5 font-medium",
        variantStyles[finalVariant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotStyles[finalVariant])}
        />
      )}
      {displayStatus}
    </Badge>
  );
}
