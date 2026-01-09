"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  WIDGET_CATALOG,
  WIDGET_CATEGORIES,
  type WidgetCategory,
  type WidgetDefinition,
} from "@/types/widget-catalog";

interface AddWidgetSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWidget: (widget: WidgetDefinition) => void;
  activeWidgets?: string[];
}

export function AddWidgetSidebar({
  open,
  onOpenChange,
  onAddWidget,
  activeWidgets = [],
}: AddWidgetSidebarProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<WidgetCategory>("featured");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWidgets = WIDGET_CATALOG.filter((widget) => {
    const matchesCategory = widget.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isWidgetActive = (widgetId: string) => activeWidgets.includes(widgetId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">Add Card</SheetTitle>
              <SheetDescription>
                Choose a widget to add to your dashboard
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar Categories */}
          <div className="bg-muted/30 w-48 border-r">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-4">
                {WIDGET_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Search Bar */}
            <div className="border-b px-6 py-4">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search widgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Widget Grid */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold capitalize">
                  {
                    WIDGET_CATEGORIES.find((c) => c.id === selectedCategory)
                      ?.name
                  }
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredWidgets.map((widget) => {
                    const isActive = isWidgetActive(widget.id);
                    return (
                      <Card
                        key={widget.id}
                        className={cn(
                          "cursor-pointer border-2 transition-all hover:shadow-md",
                          isActive
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50 border-transparent",
                        )}
                        onClick={() => !isActive && onAddWidget(widget)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-2xl">{widget.icon}</span>
                                <CardTitle className="text-base">
                                  {widget.name}
                                </CardTitle>
                              </div>
                              <CardDescription className="text-xs">
                                {widget.description}
                              </CardDescription>
                            </div>
                            {isActive && (
                              <div className="shrink-0">
                                <div className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                                  Added
                                </div>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
                {filteredWidgets.length === 0 && (
                  <div className="text-muted-foreground py-12 text-center">
                    <p>No widgets found matching your search.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
