"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, ArrowLeft } from "lucide-react";
import PageContainer from "@/components/layout/page-container";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const createWorkspace = api.workspace.create.useMutation({
    onSuccess: (data) => {
      toast.success("Workspace created successfully");
      // Set cookie and redirect
      document.cookie = `workspace-id=${data.id}; path=/; max-age=31536000`;
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send slug if user has entered one
    const payload: { name: string; slug?: string } = { name };
    if (slug.trim()) {
      payload.slug = slug;
    }
    createWorkspace.mutate(payload);
  };

  return (
    <PageContainer>
      <div className="flex h-full flex-col items-center justify-center py-10">
        <div className="mb-8 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Building2 className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create a new workspace
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Workspaces are shared environments where teams can collaborate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-lg">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Workspace Details</CardTitle>
              <CardDescription>
                Enter a name and unique URL for your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Corp"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    // Auto-generate slug if user hasn't manually edited it (simple heuristic)
                    if (
                      !slug ||
                      slug ===
                        name
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .slice(0, -1)
                    ) {
                      const generated = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-");
                      setSlug(generated);
                    }
                  }}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Workspace URL{" "}
                  <span className="text-muted-foreground text-xs">
                    (Optional)
                  </span>
                </Label>
                <div className="ring-offset-background focus-within:ring-ring flex rounded-md shadow-sm focus-within:ring-2 focus-within:ring-offset-2">
                  <span className="bg-muted text-muted-foreground flex items-center rounded-l-md border border-r-0 px-3 text-sm select-none">
                    app.crm.com/
                  </span>
                  <Input
                    id="slug"
                    placeholder="acme-corp"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    pattern="^[a-z0-9-]+$"
                    title="Lowercase alphanumeric with hyphens only"
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Leave blank to auto-generate from workspace name.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
              <Button
                type="submit"
                className="w-1/2"
                disabled={createWorkspace.isPending}
              >
                {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-1/2"
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </PageContainer>
  );
}
