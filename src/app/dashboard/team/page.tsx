"use client";

import { useState } from "react";
import PageContainer from "@/components/layout/page-container";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconUsers,
  IconLoader2,
  IconUserPlus,
  IconUserMinus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const roleColors: Record<string, string> = {
  ADMIN:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AGENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  VIEWER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

  const utils = api.useUtils();

  const { data: teams, isLoading: teamsLoading } = api.team.getAll.useQuery();
  const { data: users, isLoading: usersLoading } = api.user.getAll.useQuery();

  const createTeam = api.team.create.useMutation({
    onSuccess: () => {
      toast.success("Team created successfully");
      utils.team.getAll.invalidate();
      utils.user.getAll.invalidate();
      setCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateTeam = api.team.update.useMutation({
    onSuccess: () => {
      toast.success("Team updated successfully");
      utils.team.getAll.invalidate();
      setEditOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeam = api.team.delete.useMutation({
    onSuccess: () => {
      toast.success("Team deleted successfully");
      utils.team.getAll.invalidate();
      utils.user.getAll.invalidate();
      setDeleteTeamId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addMember = api.team.addMember.useMutation({
    onSuccess: () => {
      toast.success("Member added to team");
      utils.team.getAll.invalidate();
      utils.user.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMember = api.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed from team");
      utils.team.getAll.invalidate();
      utils.user.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setTeamName("");
    setTeamDescription("");
    setEditingTeam(null);
    setSelectedTeam(null);
    setSelectedMembers([]);
  };

  const handleCreate = () => {
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    // Create team without manager requirement
    createTeam.mutate({
      name: teamName,
      description: teamDescription,
      managerId: "", // Will be handled on backend to use current user or default
    });
  };

  const handleEdit = (team: any) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description || "");
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!teamName.trim() || !editingTeam) {
      toast.error("Please enter a team name");
      return;
    }
    updateTeam.mutate({
      id: editingTeam.id,
      name: teamName,
      description: teamDescription,
    });
  };

  const handleDelete = (teamId: string) => {
    deleteTeam.mutate({ id: teamId });
  };

  const handleManageMembers = (team: any) => {
    setSelectedTeam(team);
    setSelectedMembers(team.members.map((m: any) => m.id));
    setManageMembersOpen(true);
  };

  const handleSaveMembers = async () => {
    if (!selectedTeam) return;

    const currentMemberIds = selectedTeam.members.map((m: any) => m.id);

    // Find members to add (in selectedMembers but not in currentMemberIds)
    const toAdd = selectedMembers.filter(
      (id) => !currentMemberIds.includes(id),
    );

    // Find members to remove (in currentMemberIds but not in selectedMembers)
    const toRemove = currentMemberIds.filter(
      (id: string) => !selectedMembers.includes(id),
    );

    try {
      // Add new members
      for (const userId of toAdd) {
        await addMember.mutateAsync({ teamId: selectedTeam.id, userId });
      }

      // Remove members
      for (const userId of toRemove) {
        await removeMember.mutateAsync({ userId, teamId: selectedTeam.id });
      }

      setManageMembersOpen(false);
      resetForm();
    } catch (error) {
      // Errors are handled by mutation callbacks
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const filteredUsers =
    users?.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  if (teamsLoading || usersLoading) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <IconLoader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Team Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create teams and assign members for better organization
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>

        {/* Teams Grid */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            Teams ({teams?.length || 0})
          </h2>
          {teams?.length === 0 ? (
            <Card>
              <CardContent className="flex h-64 flex-col items-center justify-center">
                <div className="bg-primary/10 rounded-full p-4">
                  <IconUsers className="text-primary h-8 w-8" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  No teams created yet
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Create your first team to start organizing your workspace.
                </p>
                <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams?.map((team) => (
                <Card
                  key={team.id}
                  className="group transition-all hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.description && (
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-sm">
                        <IconUsers className="mr-1 h-3 w-3" />
                        {team._count.members} members
                      </Badge>
                    </div>

                    {/* Team Members Preview */}
                    {team.members.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-xs font-medium">
                          Team Members:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {team.members.slice(0, 3).map((member: any) => (
                            <Badge
                              key={member.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {member.name}
                            </Badge>
                          ))}
                          {team.members.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{team.members.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleManageMembers(team)}
                      >
                        <IconUserPlus className="mr-1 h-4 w-4" />
                        Manage
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(team)}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteTeamId(team.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Users Table */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>
                All Workspace Members ({users?.length || 0})
              </CardTitle>
              <div className="relative">
                <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search members..."
                  className="w-[250px] pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Teams
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="h-32 text-center">
                        <p className="text-muted-foreground">No users found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                                {user.name?.charAt(0) ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge
                            className={roleColors[user.role] ?? ""}
                            variant="secondary"
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {user.teamMemberships &&
                          user.teamMemberships.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.teamMemberships.map((membership: any) => (
                                <Badge key={membership.id} variant="outline">
                                  {membership.team.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No teams
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create Team Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a team to organize your workspace members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  placeholder="Sales Team, Support Team, etc."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the team's purpose..."
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createTeam.isPending}>
                {createTeam.isPending && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>Update team information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Team Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Sales Team, Support Team, etc."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe the team's purpose..."
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateTeam.isPending}>
                {updateTeam.isPending && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Members Dialog */}
        <Dialog open={manageMembersOpen} onOpenChange={setManageMembersOpen}>
          <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>Manage Team Members</DialogTitle>
              <DialogDescription>
                Add or remove members from <strong>{selectedTeam?.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 space-y-2 overflow-y-auto py-4">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={selectedMembers.includes(user.id)}
                    onCheckedChange={() => toggleMember(user.id)}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                      {user.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {user.email}
                    </p>
                  </div>
                  <Badge
                    className={roleColors[user.role] ?? ""}
                    variant="secondary"
                  >
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setManageMembersOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMembers}
                disabled={addMember.isPending || removeMember.isPending}
              >
                {(addMember.isPending || removeMember.isPending) && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteTeamId}
          onOpenChange={() => setDeleteTeamId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the team. Team members will not be
                deleted but will be unassigned from this team.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTeamId && handleDelete(deleteTeamId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageContainer>
  );
}
