import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import type { Icon as TablerIcon } from "@tabler/icons-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: TablerIcon | LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: "default" | "gradient" | "bordered";
  gradientFrom?: string;
  gradientTo?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  className,
  variant = "default",
  gradientFrom = "from-blue-500",
  gradientTo = "to-blue-600",
}: StatCardProps) {
  if (variant === "gradient") {
    return (
      <Card
        className={cn(
          `bg-linear-to-br ${gradientFrom} ${gradientTo} border-0 text-white shadow-lg`,
          className,
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{title}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              {subtitle && (
                <p className="mt-1 text-sm text-white/70">{subtitle}</p>
              )}
            </div>
            {Icon && (
              <div className="rounded-xl bg-white/20 p-3">
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          {trend && (
            <div className="mt-4 flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-200" : "text-red-200",
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-white/60">vs last period</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "bordered") {
    return (
      <Card
        className={cn(
          "border-l-primary border-l-4 transition-shadow hover:shadow-md",
          className,
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                {title}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
              )}
            </div>
            {Icon && (
              <div className={cn("bg-primary/10 rounded-lg p-3", iconColor)}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
          {trend && (
            <div className="mt-4 flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600",
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground text-sm">
                vs last period
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("bg-muted rounded-lg p-3", iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1">
            <span
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground text-sm">
              vs last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
