import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Icon as TablerIcon } from "@tabler/icons-react";
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: TablerIcon;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    icon?: TablerIcon;
    onClick?: () => void;
    variant?: "outline" | "ghost" | "secondary";
  };
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {secondaryAction && (
          <Button
            variant={secondaryAction.variant ?? "outline"}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.icon && (
              <secondaryAction.icon className="mr-2 h-4 w-4" />
            )}
            {secondaryAction.label}
          </Button>
        )}
        {action && (
          <Button onClick={action.onClick}>
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
