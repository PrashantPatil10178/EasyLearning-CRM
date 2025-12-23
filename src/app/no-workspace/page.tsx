import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Plus, Users, ArrowRight, Home } from "lucide-react";

export default function NoWorkspacePage() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <Card className="mx-auto w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-4 text-center">
          {/* Icon */}
          <div className="bg-primary/10 mx-auto flex h-24 w-24 items-center justify-center rounded-full">
            <Building2 className="text-primary h-12 w-12" />
          </div>

          <div>
            <CardTitle className="text-3xl">
              Welcome to EasyLearning CRM
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              You're not a member of any workspace yet
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg border p-6">
            <h3 className="mb-4 font-semibold">What would you like to do?</h3>

            <div className="space-y-4">
              {/* Create Workspace Option */}
              <div className="bg-background flex items-start gap-4 rounded-lg border p-4">
                <div className="bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <Plus className="text-primary h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Create a New Workspace</h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Set up your own workspace and invite team members to
                    collaborate
                  </p>
                </div>
              </div>

              {/* Join Workspace Option */}
              <div className="bg-background flex items-start gap-4 rounded-lg border p-4">
                <div className="bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <Users className="text-primary h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Wait for an Invitation</h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Ask an admin to add you to an existing workspace
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> You need to be a member of at least one
              workspace to access the CRM features.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full gap-2" size="lg">
            <Link href="/dashboard/create-workspace">
              <Plus className="h-4 w-4" />
              Create Your First Workspace
              <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <p className="text-muted-foreground mt-2 text-center text-xs">
            Already have an invitation?{" "}
            <Link
              href="/signin"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Sign in again
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
