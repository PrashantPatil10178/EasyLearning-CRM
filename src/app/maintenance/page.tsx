"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, Wrench, Mail, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MaintenancePage() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="rounded-full bg-blue-500/10 p-8">
              <Wrench className="h-24 w-24 text-blue-500" />
            </div>
            <div className="absolute right-0 bottom-0 animate-pulse rounded-full bg-blue-500 p-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Under Maintenance
          </h2>
          <p className="text-muted-foreground text-lg">
            We're currently performing scheduled maintenance to improve your
            experience. We'll be back shortly!
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">What's happening?</h3>
              </div>
              <ul className="text-muted-foreground ml-7 list-disc space-y-2 text-sm">
                <li>Scheduled system maintenance and upgrades</li>
                <li>Improving performance and security</li>
                <li>Adding new features to enhance your experience</li>
                <li>All your data is safe and will be available soon</li>
              </ul>
              <div className="mt-4 rounded-md bg-blue-500/10 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Estimated time:</strong> We expect to be back online
                  within 30-60 minutes.
                </p>
              </div>
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
            Check Status
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Try Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="gap-2">
            <Link href="https://status.easylearning.com" target="_blank">
              Status Page
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground mt-12 space-y-2 text-sm">
          <p className="font-medium">Need immediate assistance?</p>
          <p>
            Contact our support team at{" "}
            <a
              href="mailto:support@easylearning.com"
              className="text-primary hover:underline"
            >
              support@easylearning.com
            </a>
          </p>
          <p className="text-xs">Thank you for your patience!</p>
        </div>
      </div>
    </div>
  );
}
