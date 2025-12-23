import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Icon as TablerIcon, IconPlus } from "@tabler/icons-react";

interface EmptyStateProps {
  icon?: TablerIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = IconPlus,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center",
        className,
      )}
    >
      <div className="bg-muted rounded-full p-4">
        <Icon className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        {description}
      </p>
      {action && (
        <Button className="mt-6" onClick={action.onClick}>
          <IconPlus className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
