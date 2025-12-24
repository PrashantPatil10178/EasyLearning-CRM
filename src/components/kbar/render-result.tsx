import { KBarResults, useMatches } from "kbar";
import ResultItem from "./result-item";

export default function RenderResults() {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="bg-muted/50 border-border text-muted-foreground sticky top-0 z-10 border-b px-5 py-2.5 text-xs font-semibold tracking-wider uppercase">
            {item}
          </div>
        ) : (
          <ResultItem
            action={item}
            active={active}
            currentRootActionId={rootActionId ?? ""}
          />
        )
      }
    />
  );
}
