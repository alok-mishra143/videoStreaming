import React, { useState, useContext } from "react";
import {
  getMyOrgs,
  addMember,
  updateMemberRole,
  removeMember,
  type Organization as ServiceOrganization,
} from "../services/orgService";
import { AuthContext } from "../context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserPlus, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Organization extends ServiceOrganization {
  role: "owner" | "editor" | "viewer";
}

const OrgManagement = () => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const { user } = useContext(AuthContext)!;
  const queryClient = useQueryClient();

  const { data: orgs = [] } = useQuery<Organization[]>({
    queryKey: ["orgsWithRoles", user?._id],
    queryFn: async () => {
      const data = await getMyOrgs();
      return data.map((org: ServiceOrganization) => {
        let role = "viewer";
        if (org.owner._id === user?._id) {
          role = "owner";
        } else {
          const member = org.members.find((m) => m.user._id === user?._id);
          if (member) role = member.role;
        }
        return { ...org, role: role as "owner" | "editor" | "viewer" };
      });
    },
    enabled: !!user,
  });

  const activeOrgId = selectedOrgId || (orgs.length > 0 ? orgs[0]._id : "");

  const inviteMutation = useMutation({
    mutationFn: async () => {
      await addMember(activeOrgId, email, role);
    },
    onSuccess: () => {
      toast.success("Member added successfully!");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["orgsWithRoles"] });
    },
    onError: (error: unknown) => {
      console.error("Failed to add member", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to add member");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "viewer" | "editor";
    }) => {
      await updateMemberRole(activeOrgId, userId, role);
    },
    onSuccess: () => {
      toast.success("Member role updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["orgsWithRoles"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to update member role"
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await removeMember(activeOrgId, userId);
    },
    onSuccess: () => {
      toast.success("Member removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["orgsWithRoles"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to remove member");
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !email) return;

    inviteMutation.mutate();
  };

  const selectedOrg = orgs.find((o) => o._id === activeOrgId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Organization Management
        </CardTitle>
        <CardDescription>
          Manage your organizations and invite members.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Select Organization</Label>
          <Select value={activeOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent>
              {orgs.map((org) => (
                <SelectItem key={org._id} value={org._id}>
                  {org.name} ({org.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedOrg && selectedOrg.role === "owner" && (
          <form onSubmit={handleInvite} className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <h3 className="font-medium">Invite Member</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(val: "editor" | "viewer") => setRole(val)}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Inviting..." : "Invite Member"}
            </Button>
          </form>
        )}

        {selectedOrg && selectedOrg.role !== "owner" && (
          <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
            You are a <strong>{selectedOrg.role}</strong> in this organization.
            Only owners can invite new members.
          </div>
        )}

        {selectedOrg && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <h3 className="font-medium">Organization Members</h3>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {selectedOrg.owner.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedOrg.owner.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-primary" />
                      <span>Owner</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-muted-foreground text-sm">
                      Cannot edit
                    </span>
                  </TableCell>
                </TableRow>
                {selectedOrg.members.map((member) =>
                  member.user ? (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {member.user.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {member.user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {selectedOrg.role === "owner" ? (
                          <Select
                            defaultValue={member.role}
                            onValueChange={(val: "editor" | "viewer") =>
                              updateMutation.mutate({
                                userId: member.user._id,
                                role: val,
                              })
                            }
                            disabled={updateMutation.isPending}
                          >
                            <SelectTrigger className="w-25 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="capitalize">{member.role}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {selectedOrg.role === "owner" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive/90"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove member?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  <span className="font-medium">
                                    {member.user.username}
                                  </span>{" "}
                                  from the organization? They will lose access
                                  to all shared resources.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    removeMutation.mutate(member.user._id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : null
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrgManagement;
