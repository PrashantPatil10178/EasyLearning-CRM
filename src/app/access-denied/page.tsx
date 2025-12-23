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
import { ShieldX, Home, LogIn, ArrowLeft } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      <Card className="border-destructive/50 mx-auto w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-4 text-center">
          {/* Icon */}
          <div className="bg-destructive/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <ShieldX className="text-destructive h-10 w-10" />
          </div>

          {/* Error Code */}
          <div>
            <div className="text-destructive mb-2 text-6xl font-bold">403</div>
            <div className="bg-destructive mx-auto h-1 w-16 rounded-full"></div>
          </div>

          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this resource. This could be
            because:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>Your session has expired</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>You're not logged in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>Your account doesn't have the required permissions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>You're not a member of any workspace</span>
            </li>
          </ul>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full gap-2" size="lg">
            <Link href="/signin">
              <LogIn className="h-4 w-4" />
              Sign In to Continue
            </Link>
          </Button>

          <div className="flex w-full gap-2">
            <Button asChild variant="outline" className="flex-1 gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 gap-2">
              <Link href="javascript:history.back()">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>

          <p className="text-muted-foreground mt-2 text-center text-xs">
            Need help?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
