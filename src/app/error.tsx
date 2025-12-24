"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ServerCrash,
  Home,
  RefreshCw,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ServerErrorPage() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="rounded-full bg-red-500/10 p-8">
              <ServerCrash className="h-24 w-24 text-red-500" />
            </div>
            <div className="absolute right-0 bottom-0 animate-pulse rounded-full bg-red-500 p-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-7xl font-bold text-red-500">500</h1>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-red-500"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Internal Server Error
          </h2>
          <p className="text-muted-foreground text-lg">
            Oops! Something went wrong on our end. We're working to fix the
            issue. Please try again later.
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-red-500/20">
          <CardContent className="pt-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">What happened?</h3>
              </div>
              <ul className="text-muted-foreground ml-7 list-disc space-y-2 text-sm">
                <li>Our server encountered an unexpected error</li>
                <li>Your data is safe - this is a temporary issue</li>
                <li>Our team has been automatically notified</li>
                <li>Try refreshing the page or come back in a few minutes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="gap-2">
            <Link href="https://support.easylearning.com" target="_blank">
              <Mail className="h-4 w-4" />
              Contact Support
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground mt-12 space-y-2 text-sm">
          <p className="font-medium">Error persists?</p>
          <p>
            Please contact our support team at{" "}
            <a
              href="mailto:support@easylearning.com"
              className="text-primary hover:underline"
            >
              support@easylearning.com
            </a>
          </p>
          <p className="text-xs">Error Reference: {new Date().getTime()}</p>
        </div>
      </div>
    </div>
  );
}
