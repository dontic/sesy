import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Crown,
  KeyRound,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  UserPlus
} from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import UserFormDialog from "@/components/settings/UserFormDialog";
import TempPasswordDialog, {
  type TempCredentials
} from "@/components/settings/TempPasswordDialog";
import { useUserStore } from "@/stores/UserStore";
import {
  authUsersDestroy,
  authUsersList,
  authUsersResetPasswordCreate,
  authUsersTransferOwnershipCreate
} from "@/api/django/users/users";
import type { RoleEnum, UserManagement } from "@/api/django/djangoAPI.schemas";
import { getApiErrorMessage } from "@/lib/api-errors";

// The API types role as an assignable role, but the owner is also returned
const getRole = (user: UserManagement) => user.role as RoleEnum;

const ROLE_ORDER: Record<RoleEnum, number> = { owner: 0, admin: 1, user: 2 };

const RoleBadge = ({ role }: { role: RoleEnum }) => {
  if (role === "owner") {
    return (
      <Badge>
        <Crown />
        Owner
      </Badge>
    );
  }
  if (role === "admin") {
    return (
      <Badge variant="secondary">
        <ShieldCheck />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <UserIcon />
      User
    </Badge>
  );
};

const displayName = (user: UserManagement) =>
  [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username;

const initials = (user: UserManagement) => {
  const fromName = `${user.first_name?.charAt(0) ?? ""}${user.last_name?.charAt(0) ?? ""}`;
  return (fromName || user.username.slice(0, 2)).toUpperCase();
};

type PendingAction = {
  type: "delete" | "reset-password" | "transfer-ownership";
  user: UserManagement;
};

const ACTION_COPY: Record<
  PendingAction["type"],
  { title: string; confirm: string; destructive: boolean }
> = {
  delete: { title: "Delete user?", confirm: "Delete", destructive: true },
  "reset-password": {
    title: "Reset password?",
    confirm: "Reset Password",
    destructive: false
  },
  "transfer-ownership": {
    title: "Transfer ownership?",
    confirm: "Transfer Ownership",
    destructive: true
  }
};

const ActionDescription = ({ action }: { action: PendingAction }) => {
  const name = <strong>{displayName(action.user)}</strong>;
  switch (action.type) {
    case "delete":
      return (
        <>
          {name} will lose access immediately. Projects and API keys they
          created will be reassigned to you. This action cannot be undone.
        </>
      );
    case "reset-password":
      return (
        <>
          A new temporary password will be generated for {name} and their
          current password will stop working. They will have to choose a new
          password on their next sign in.
        </>
      );
    case "transfer-ownership":
      return (
        <>
          {name} will become the owner of this workspace and you will become an
          admin. Only the new owner can transfer ownership back.
        </>
      );
  }
};

const UsersTab = () => {
  const { user: currentUser, setUser } = useUserStore();

  const [users, setUsers] = useState<UserManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | undefined>();
  const [credentials, setCredentials] = useState<TempCredentials | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isRunningAction, setIsRunningAction] = useState(false);

  const isOwner = currentUser?.role === "owner";

  const loadUsers = async () => {
    try {
      setUsers(await authUsersList());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load users."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const sortedUsers = [...users].sort(
    (a, b) => ROLE_ORDER[getRole(a)] - ROLE_ORDER[getRole(b)]
  );

  const openCreate = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (user: UserManagement) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const runPendingAction = async () => {
    if (!pendingAction) return;
    const { type, user } = pendingAction;
    setIsRunningAction(true);
    try {
      if (type === "delete") {
        await authUsersDestroy(user.pk);
        setUsers((prev) => prev.filter((u) => u.pk !== user.pk));
        toast.success(`${displayName(user)} has been deleted`);
      } else if (type === "reset-password") {
        const result = await authUsersResetPasswordCreate(user.pk);
        setUsers((prev) =>
          prev.map((u) =>
            u.pk === user.pk ? { ...u, must_change_password: true } : u
          )
        );
        setCredentials({ ...result, reason: "reset" });
      } else {
        await authUsersTransferOwnershipCreate(user.pk);
        if (currentUser) setUser({ ...currentUser, role: "admin" });
        await loadUsers();
        toast.success(`${displayName(user)} is now the owner`);
      }
      setPendingAction(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Something went wrong. Please try again."));
    } finally {
      setIsRunningAction(false);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage who has access to this workspace and what they can do.
          </CardDescription>
          <CardAction>
            <Button size="sm" className="hover:cursor-pointer" onClick={openCreate}>
              <UserPlus className="h-4 w-4" />
              Add user
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y rounded-md border">
              {sortedUsers.map((user) => {
                const role = getRole(user);
                const isSelf = user.pk === currentUser?.pk;
                const canManage = role !== "owner" && !isSelf;

                return (
                  <li
                    key={user.pk}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-medium">
                        {initials(user)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {displayName(user)}
                        </span>
                        {isSelf && (
                          <span className="text-xs text-muted-foreground">(you)</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="truncate">@{user.username}</span>
                        <span aria-hidden>·</span>
                        {user.must_change_password ? (
                          <span className="text-amber-600 dark:text-amber-500">
                            Awaiting password change
                          </span>
                        ) : user.last_login ? (
                          <span>
                            Active{" "}
                            {formatDistanceToNow(new Date(user.last_login), {
                              addSuffix: true
                            })}
                          </span>
                        ) : (
                          <span>Never signed in</span>
                        )}
                      </div>
                    </div>

                    <RoleBadge role={role} />

                    <div className="w-8">
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:cursor-pointer"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              className="hover:cursor-pointer"
                              onClick={() => openEdit(user)}
                            >
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="hover:cursor-pointer"
                              onClick={() =>
                                setPendingAction({ type: "reset-password", user })
                              }
                            >
                              <KeyRound />
                              Reset password
                            </DropdownMenuItem>
                            {isOwner && (
                              <DropdownMenuItem
                                className="hover:cursor-pointer"
                                onClick={() =>
                                  setPendingAction({ type: "transfer-ownership", user })
                                }
                              >
                                <Crown />
                                Make owner
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="hover:cursor-pointer"
                              onClick={() => setPendingAction({ type: "delete", user })}
                            >
                              <Trash2 />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={editingUser}
        onCreated={(created) => {
          const { temp_password, ...user } = created;
          setUsers((prev) => [...prev, user]);
          setCredentials({ username: created.username, temp_password, reason: "created" });
        }}
        onSaved={(updated) =>
          setUsers((prev) => prev.map((u) => (u.pk === updated.pk ? updated : u)))
        }
      />

      <TempPasswordDialog credentials={credentials} onClose={() => setCredentials(null)} />

      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && !isRunningAction && setPendingAction(null)}
      >
        <AlertDialogContent>
          {pendingAction && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{ACTION_COPY[pendingAction.type].title}</AlertDialogTitle>
                <AlertDialogDescription>
                  <ActionDescription action={pendingAction} />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRunningAction}>Cancel</AlertDialogCancel>
                <Button
                  variant={ACTION_COPY[pendingAction.type].destructive ? "destructive" : "default"}
                  className="hover:cursor-pointer"
                  loading={isRunningAction}
                  onClick={runPendingAction}
                >
                  {ACTION_COPY[pendingAction.type].confirm}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersTab;
