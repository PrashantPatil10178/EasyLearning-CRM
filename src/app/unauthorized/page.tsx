"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, ArrowLeft, Lock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="bg-destructive/10 rounded-full p-8">
              <ShieldAlert className="text-destructive h-24 w-24" />
            </div>
            <div className="bg-destructive absolute right-0 bottom-0 rounded-full p-3">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-destructive text-7xl font-bold">401</h1>
          <div className="bg-destructive mx-auto mt-4 h-1 w-24 rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Unauthorized Access
          </h2>
          <p className="text-muted-foreground text-lg">
            You don't have permission to access this resource. Please sign in
            with an authorized account or contact your administrator.
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-destructive/20 mb-8">
          <CardContent className="pt-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-destructive h-5 w-5" />
                <h3 className="font-semibold">Why am I seeing this?</h3>
              </div>
              <ul className="text-muted-foreground ml-7 list-disc space-y-2 text-sm">
                <li>You're not signed in to your EasyLearning CRM account</li>
                <li>Your session may have expired</li>
                <li>You don't have the required role permissions</li>
                <li>Your account may be inactive or suspended</li>
                <li>The workspace you're trying to access is restricted</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/auth/sign-in">
              <Lock className="h-4 w-4" />
              Sign In
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
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
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
