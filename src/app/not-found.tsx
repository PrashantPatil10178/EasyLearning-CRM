import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <div className="mx-auto max-w-md text-center">
        {/* 404 Large Text */}
        <div className="mb-8">
          <h1 className="text-primary text-9xl font-bold">404</h1>
          <div className="bg-primary mx-auto mt-4 h-1 w-24 rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Search Icon Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="bg-muted rounded-full p-6">
            <Search className="text-muted-foreground h-16 w-16" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground mt-12 text-sm">
          <p>
            Need help?{" "}
            <Link
              href="/signin"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
