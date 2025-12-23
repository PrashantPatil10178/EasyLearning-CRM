"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function WorkspaceRedirect({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();

  useEffect(() => {
    // Set the workspace cookie
    document.cookie = `workspace-id=${workspaceId}; path=/; max-age=31536000`;
    // Reload the page to apply the cookie to SSR requests
    window.location.reload();
  }, [workspaceId, router]);

  return (
    <div className="bg-muted/50 flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
        <p className="text-muted-foreground">Setting up your workspace...</p>
      </div>
    </div>
  );
}
