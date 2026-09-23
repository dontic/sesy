import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  authUsersCreate,
  authUsersPartialUpdate
} from "@/api/django/users/users";
import {
  AssignableRoleEnum,
  type UserCreated,
  type UserManagement
} from "@/api/django/djangoAPI.schemas";
import { getApiErrorMessage } from "@/lib/api-errors";

export const ROLE_DESCRIPTIONS: Record<AssignableRoleEnum, string> = {
  admin: "Can manage users, AWS SES, domains and API keys, plus everything a user can do.",
  user: "Can manage projects, audiences and campaigns."
};

const UserFormSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(150, "Username must be 150 characters or less")
    .regex(
      /^[\w.@+-]+$/,
      "Enter a valid username. Letters, digits and @/./+/-/_ only."
    ),
  first_name: z.string().max(150, "First name must be 150 characters or less"),
  last_name: z.string().max(150, "Last name must be 150 characters or less"),
  role: z.enum([AssignableRoleEnum.admin, AssignableRoleEnum.user])
});

type UserFormValues = z.infer<typeof UserFormSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // When set the dialog edits this user, otherwise it creates a new one
  user?: UserManagement;
  onCreated?: (user: UserCreated) => void;
  onSaved?: (user: UserManagement) => void;
}

const emptyValues: UserFormValues = {
  username: "",
  first_name: "",
  last_name: "",
  role: AssignableRoleEnum.user
};

const UserFormDialog = ({ open, onOpenChange, user, onCreated, onSaved }: Props) => {
  const isEditing = !!user;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: emptyValues
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      user
        ? {
            username: user.username,
            first_name: user.first_name ?? "",
            last_name: user.last_name ?? "",
            role: user.role === AssignableRoleEnum.admin ? "admin" : "user"
          }
        : emptyValues
    );
  }, [open, user, form]);

  const selectedRole = form.watch("role");

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      if (user) {
        const updated = await authUsersPartialUpdate(user.pk, {
          first_name: values.first_name,
          last_name: values.last_name,
          role: values.role
        });
        toast.success("User updated");
        onSaved?.(updated);
      } else {
        const created = await authUsersCreate(values);
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditing
            ? "Failed to update user. Please try again."
            : "Failed to create user. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this user's name and role."
              : "A temporary password will be generated. The user will be asked to change it the first time they sign in."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="janedoe"
                      autoComplete="off"
                      disabled={isEditing}
                      {...field}
                    />
                  </FormControl>
                  {isEditing && (
                    <FormDescription>Usernames can't be changed.</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{ROLE_DESCRIPTIONS[selectedRole]}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="hover:cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="hover:cursor-pointer" loading={isSubmitting}>
                {isEditing ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
