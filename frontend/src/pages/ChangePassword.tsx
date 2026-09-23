/*
Shown to users that were created (or had their password reset) by an admin.
They must replace their temporary password before they can use the rest of the app.
*/

import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, LogOut } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import Icon from "@/assets/icon.svg?react";

import { useUserStore } from "@/stores/UserStore";
import {
  authLogoutCreate,
  authMeRetrieve,
  authPasswordChangeCreate
} from "@/api/django/auth/auth";
import { getApiErrorMessage } from "@/lib/api-errors";

const NewPasswordSchema = z
  .object({
    new_password1: z.string().min(8, "Password must be at least 8 characters"),
    new_password2: z.string().min(1, "Please confirm your new password")
  })
  .refine((data) => data.new_password1 === data.new_password2, {
    message: "Passwords do not match",
    path: ["new_password2"]
  });

type NewPasswordValues = z.infer<typeof NewPasswordSchema>;

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useUserStore();

  const [isLoading, setIsLoading] = useState(!user);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: { new_password1: "", new_password2: "" }
  });

  useEffect(() => {
    if (user) return;
    const controller = new AbortController();

    authMeRetrieve({ signal: controller.signal })
      .then((userDetails) => {
        setUser(userDetails);
        setIsAuthenticated(true);
      })
      .catch((error) => {
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [user, setUser]);

  const onSubmit = async (values: NewPasswordValues) => {
    setIsSubmitting(true);
    try {
      await authPasswordChangeCreate(values);
      setUser({ ...user!, must_change_password: false });
      toast.success("Password changed successfully");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to change password. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authLogoutCreate();
    } finally {
      clearUser();
      navigate("/login", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.must_change_password) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Icon className="h-[50px]" />
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome{user?.first_name ? `, ${user.first_name}` : ""}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>
              You signed in with a temporary password. Choose a new password to
              continue using Sesy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="new_password1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="new_password2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Save Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          className="self-center text-muted-foreground hover:cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
};

export default ChangePassword;
