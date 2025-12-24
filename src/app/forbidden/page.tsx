import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, ArrowLeft, UserX, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="rounded-full bg-orange-500/10 p-8">
              <ShieldX className="h-24 w-24 text-orange-500" />
            </div>
            <div className="absolute right-0 bottom-0 rounded-full bg-orange-500 p-3">
              <UserX className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-7xl font-bold text-orange-500">403</h1>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-orange-500"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Access Forbidden
          </h2>
          <p className="text-muted-foreground text-lg">
            You don't have the required permissions to access this resource.
            Your role doesn't allow this action.
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">Permission Required</h3>
              </div>
              <ul className="text-muted-foreground ml-7 list-disc space-y-2 text-sm">
                <li>This action requires Admin or Manager privileges</li>
                <li>Your current role: Agent or Viewer</li>
                <li>Contact your workspace administrator for access</li>
                <li>
                  Some features are restricted based on your subscription plan
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/dashboard/profile">
              <UserX className="h-4 w-4" />
              View My Profile
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="gap-2">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground mt-12 text-sm">
          <p>
            Need elevated access?{" "}
            <Link
              href="https://support.easylearning.com"
              className="text-primary hover:underline"
              target="_blank"
            >
              Contact Your Administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
