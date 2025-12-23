import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Icon as TablerIcon } from "@tabler/icons-react";
import Link from "next/link";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: TablerIcon;
  href: string;
  iconColor?: string;
  iconBgColor?: string;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="group hover:border-primary/50 hover:bg-accent/50 cursor-pointer border-2 border-dashed p-6 transition-all hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className={cn("rounded-xl p-3", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <div>
            <h3 className="group-hover:text-primary font-semibold transition-colors">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
