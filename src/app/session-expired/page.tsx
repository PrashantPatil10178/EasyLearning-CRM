"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, Home, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SessionExpiredPage() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="rounded-full bg-amber-500/10 p-8">
              <Clock className="h-24 w-24 text-amber-500" />
            </div>
            <div className="absolute right-0 bottom-0 animate-pulse rounded-full bg-amber-500 p-3">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Session Expired</h2>
          <p className="text-muted-foreground text-lg">
            Your session has expired due to inactivity. Please sign in again to
            continue using EasyLearning CRM.
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">Why did this happen?</h3>
              </div>
              <ul className="text-muted-foreground ml-7 list-disc space-y-2 text-sm">
                <li>You've been inactive for an extended period</li>
                <li>Your session token has expired for security</li>
                <li>You may have been logged out from another device</li>
                <li>Your account password may have been changed</li>
              </ul>
              <div className="mt-4 rounded-md bg-amber-500/10 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Tip:</strong> Sessions expire after 24 hours of
                  inactivity to keep your account secure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/signin">
              <LogIn className="h-4 w-4" />
              Sign In Again
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-muted-foreground mt-12 space-y-2 text-sm">
          <p className="font-medium">Having trouble signing in?</p>
          <p>
            Contact support at{" "}
            <a
              href="mailto:support@easylearning.com"
              className="text-primary hover:underline"
            >
              support@easylearning.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
