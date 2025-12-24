import type { ActionId, ActionImpl } from "kbar";
import * as React from "react";

const ResultItem = React.forwardRef(
  (
    {
      action,
      active,
      currentRootActionId,
    }: {
      action: ActionImpl;
      active: boolean;
      currentRootActionId: ActionId;
    },
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const ancestors = React.useMemo(() => {
      if (!currentRootActionId) return action.ancestors;
      const index = action.ancestors.findIndex(
        (ancestor) => ancestor.id === currentRootActionId,
      );
      return action.ancestors.slice(index + 1);
    }, [action.ancestors, currentRootActionId]);

    // Get icon for different types
    const getIconDisplay = () => {
      if (action.icon) return action.icon;
      return null;
    };

    return (
      <div
        ref={ref}
        className={`group hover:bg-accent/70 relative z-10 flex cursor-pointer items-center justify-between px-5 py-3.5 transition-all ${
          active ? "bg-accent/70" : ""
        }`}
      >
        {active && (
          <div
            id="kbar-result-item"
            className="border-primary bg-primary absolute inset-y-0 left-0 z-[-1]! w-1"
          ></div>
        )}
        <div className="relative z-10 flex items-center gap-3">
          {getIconDisplay() && (
            <div className="bg-muted group-hover:bg-muted/70 flex h-8 w-8 items-center justify-center rounded-md text-lg">
              {getIconDisplay()}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              {ancestors.length > 0 &&
                ancestors.map((ancestor) => (
                  <React.Fragment key={ancestor.id}>
                    <span className="text-muted-foreground text-xs">
                      {ancestor.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      &rsaquo;
                    </span>
                  </React.Fragment>
                ))}
              <span className="font-medium">{action.name}</span>
            </div>
            {action.subtitle && (
              <span className="text-muted-foreground text-xs">
                {action.subtitle}
              </span>
            )}
          </div>
        </div>
        {action.shortcut?.length ? (
          <div className="relative z-10 flex gap-1">
            {action.shortcut.map((sc, i) => (
              <kbd
                key={sc + i}
                className="bg-background flex h-6 items-center gap-1 rounded border px-2 text-[10px] font-medium shadow-sm"
              >
                {sc}
              </kbd>
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);

ResultItem.displayName = "KBarResultItem";

export default ResultItem;
