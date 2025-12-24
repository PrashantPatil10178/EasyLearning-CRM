import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search, MapPin, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="bg-primary/10 rounded-full p-8">
              <Search className="text-primary h-24 w-24" />
            </div>
            <div className="bg-primary absolute right-0 bottom-0 animate-pulse rounded-full p-3">
              <MapPin className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* 404 Large Text */}
        <div className="mb-6">
          <h1 className="text-primary text-9xl font-bold">404</h1>
          <div className="bg-primary mx-auto mt-4 h-1 w-24 rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 mb-8">
          <CardContent className="pt-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-primary h-5 w-5" />
                <h3 className="font-semibold">Common reasons:</h3>
              </div>
              <ul className="text-muted-foreground ml-7 list-disc space-y-2 text-sm">
                <li>The page URL was typed incorrectly</li>
                <li>The page has been moved or deleted</li>
                <li>The link you followed is outdated or broken</li>
                <li>You don't have permission to access this page</li>
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
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button asChild variant="ghost" size="lg" className="gap-2">
            <Link href="https://support.easylearning.com" target="_blank">
              Get Help
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground mt-12 space-y-2 text-sm">
          <p>
            Need help?{" "}
            <a
              href="mailto:support@easylearning.com"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
