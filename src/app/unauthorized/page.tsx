import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <div className="mx-auto max-w-md text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-destructive text-9xl font-bold">401</h1>
          <div className="bg-destructive mx-auto mt-4 h-1 w-24 rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Unauthorized Access
          </h2>
          <p className="text-muted-foreground text-lg">
            You don't have permission to access this page. Please sign in to
            continue.
          </p>
        </div>

        {/* Shield Icon Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="bg-destructive/10 rounded-full p-6">
            <ShieldAlert className="text-destructive h-16 w-16" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/signin">
              <Home className="h-4 w-4" />
              Sign In
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground mt-12 text-sm">
          <p>
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
