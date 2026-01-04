import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { WorkspaceRedirect } from "@/components/workspace-redirect";
import { NewDashboard } from "@/components/dashboard/new-dashboard";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  // Check for workspaces
  let workspaces;
  try {
    workspaces = await api.workspace.getAll();
  } catch (error) {
    return redirect("/signin");
  }

  if (workspaces.length === 0) {
    return redirect("/no-workspace");
  }

  try {
    const [stats, recentActivities, leadSourceDistribution, upcomingFollowUps] =
      await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getRecentActivities(),
        api.dashboard.getLeadSourceDistribution(),
        api.dashboard.getUpcomingFollowUps(),
      ]);

    return (
      <PageContainer>
        <NewDashboard
          user={session.user}
          stats={stats}
          recentActivities={recentActivities}
          leadSourceDistribution={leadSourceDistribution}
          upcomingFollowUps={upcomingFollowUps}
        />
      </PageContainer>
    );
  } catch (error) {
    // If we fail to get stats (likely due to missing workspace context),
    // redirect to the first available workspace.
    return <WorkspaceRedirect workspaceId={workspaces[0]!.id} />;
  }
}
