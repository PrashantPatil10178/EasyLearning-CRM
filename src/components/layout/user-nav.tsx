"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatarProfile } from "@/components/user-avatar-profile";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Users,
  ListTodo,
  Phone,
  Building2,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { api } from "@/trpc/react";
import * as React from "react";

export function UserNav() {
  const { data: session } = useSession();
  const router = useRouter();

  // Check if CallerDesk integration is active
  const { data: callerdeskIntegration } = api.integration.get.useQuery(
    { provider: "CALLERDESK" },
    { enabled: !!session?.user },
  );

  // Check if CallerDesk is enabled AND has API key configured
  const isCallerDeskActive = React.useMemo(() => {
    if (!callerdeskIntegration?.isEnabled) return false;

    try {
      const config = JSON.parse(callerdeskIntegration.config || "{}");
      // Check if apiKey exists and is not empty (even if masked)
      return !!config.apiKey && config.apiKey.length > 0;
    } catch (e) {
      return false;
    }
  }, [callerdeskIntegration]);

  if (session) {
    const userRole = session.user.role;
    const isAdmin = userRole === "ADMIN";
    const isManager = userRole === "MANAGER";
    const isAdminOrManager = isAdmin || isManager;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <UserAvatarProfile
              user={{
                fullName: session.user.name,
                imageUrl: session.user.image ?? "",
                emailAddresses: [{ emailAddress: session.user.email ?? "" }],
              }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56"
          align="end"
          sideOffset={10}
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">
                {session.user.name}
              </p>
              <p className="text-muted-foreground text-xs leading-none">
                {session.user.email}
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-none capitalize">
                {userRole?.toLowerCase()}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push("/dashboard/leads?ownerId=" + session.user.id)
              }
            >
              <Users className="mr-2 h-4 w-4" />
              My Leads
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/overview")}
            >
              <ListTodo className="mr-2 h-4 w-4" />
              My Tasks
            </DropdownMenuItem>
            {isCallerDeskActive && (
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/call-logs")}
              >
                <Phone className="mr-2 h-4 w-4" />
                CallerDesk Logs
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          {isAdminOrManager && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/webhooks")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Webhooks
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/workspace-settings")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Lead Fields
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/students")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              window.open("https://support.easylearning.com", "_blank")
            }
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help & Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
