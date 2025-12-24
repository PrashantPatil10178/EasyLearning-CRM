"use client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserAvatarProfile } from "@/components/user-avatar-profile";
import { getNavItemsByRole } from "@/constants/data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSession, signOut } from "next-auth/react";
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconLogout,
  IconPhotoUp,
  IconUserCircle,
  IconUsers,
  IconListDetails,
  IconPhone,
  IconBuilding,
  IconHelp,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Icons } from "../icons";
import { OrgSwitcher } from "../org-switcher";
import { api } from "@/trpc/react";

export const company = {
  name: "EasyLearning CRM",
  logo: IconPhotoUp,
  plan: "Enterprise",
};

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { data: session } = useSession();
  const router = useRouter();

  const { data: workspaces, isLoading } = api.workspace.getAll.useQuery();

  const handleSwitchTenant = (tenantId: string) => {
    document.cookie = `workspace-id=${tenantId}; path=/; max-age=31536000`; // 1 year
    window.location.reload();
  };

  const activeWorkspaceId = getCookie("workspace-id");
  const activeTenant = workspaces?.find((w) => w.id === activeWorkspaceId) ||
    workspaces?.[0] || { id: "loading", name: "Loading..." };

  const tenants = workspaces?.map((w) => ({ id: w.id, name: w.name })) || [];

  // Get navigation items based on user role
  const userRole = session?.user?.role || "AGENT";
  const navItems = React.useMemo(
    () =>
      getNavItemsByRole(userRole as "ADMIN" | "MANAGER" | "AGENT" | "VIEWER"),
    [userRole],
  );

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  // If no workspaces and not loading, maybe redirect to create workspace?
  // For now, we just show empty or loading state.

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {!isLoading && tenants.length > 0 && (
          <OrgSwitcher
            tenants={tenants}
            defaultTenant={activeTenant}
            onTenantSwitch={handleSwitchTenant}
          />
        )}
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {session?.user && (
                    <UserAvatarProfile
                      className="h-8 w-8 rounded-lg"
                      showInfo
                      user={{
                        fullName: session.user.name,
                        imageUrl: session.user.image ?? "",
                        emailAddresses: [
                          { emailAddress: session.user.email ?? "" },
                        ],
                      }}
                    />
                  )}
                  <IconChevronsDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="px-1 py-1.5">
                    {session?.user && (
                      <UserAvatarProfile
                        className="h-8 w-8 rounded-lg"
                        showInfo
                        user={{
                          fullName: session.user.name,
                          imageUrl: session.user.image ?? "",
                          emailAddresses: [
                            { emailAddress: session.user.email ?? "" },
                          ],
                        }}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/profile")}
                  >
                    <IconUserCircle className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(
                        "/dashboard/leads?ownerId=" + session?.user?.id,
                      )
                    }
                  >
                    <IconUsers className="mr-2 h-4 w-4" />
                    My Leads
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/overview")}
                  >
                    <IconListDetails className="mr-2 h-4 w-4" />
                    My Tasks
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/call-logs")}
                  >
                    <IconPhone className="mr-2 h-4 w-4" />
                    Call Logs
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {(session?.user?.role === "ADMIN" ||
                  session?.user?.role === "MANAGER") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard/organization")}
                      >
                        <IconBuilding className="mr-2 h-4 w-4" />
                        Workspace Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard/students")}
                      >
                        <IconUsers className="mr-2 h-4 w-4" />
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
                  <IconHelp className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
                >
                  <IconLogout className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
