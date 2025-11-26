import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconPlus, IconMail, IconPhone } from "@tabler/icons-react";

export default async function TeamPage() {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  // Check if user has permission
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    return redirect("/dashboard");
  }

  const teams = await api.team.getAll();
  const agents = await api.user.getAgents();

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your teams and team members
            </p>
          </div>
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>

        {/* Teams Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No teams created yet. Create your first team to get started.
              </CardContent>
            </Card>
          ) : (
            teams.map((team) => (
              <Card key={team.id} className="cursor-pointer hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge variant="secondary">{team._count.members} members</Badge>
                  </div>
                  {team.description && (
                    <p className="text-muted-foreground text-sm">{team.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Manager</p>
                      <div className="flex items-center mt-1">
                        <div className="bg-primary text-primary-foreground mr-2 flex h-6 w-6 items-center justify-center rounded-full text-xs">
                          {team.manager.name?.charAt(0) ?? "?"}
                        </div>
                        <span className="text-sm">{team.manager.name}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Team Members</p>
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 5).map((member) => (
                          <div
                            key={member.id}
                            className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs"
                            title={member.name ?? ""}
                          >
                            {member.name?.charAt(0) ?? "?"}
                          </div>
                        ))}
                        {team.members.length > 5 && (
                          <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs">
                            +{team.members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* All Agents Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Agents ({agents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="bg-primary text-primary-foreground mr-3 flex h-8 w-8 items-center justify-center rounded-full text-sm">
                          {agent.name?.charAt(0) ?? "?"}
                        </div>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center text-sm">
                        <IconMail className="mr-1 h-3 w-3" />
                        {agent.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{agent.role}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
