import { useEffect, useState } from "react";
import SideBarLayout from "@/layouts/SideBarLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUserStore } from "@/stores/UserStore";
import { authMeUpdate, authPasswordChangeCreate } from "@/api/django/auth/auth";
import {
  sesySesConfigurationRetrieve,
  sesySesConfigurationUpdate
} from "@/api/django/ses-configuration/ses-configuration";
import type { SESConfiguration } from "@/api/django/djangoAPI.schemas";

const UserProfileSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(150, "Username must be 150 characters or less")
    .regex(/^[\w.@+-]+$/, "Enter a valid username. Letters, digits and @/./+/-/_ only."),
  first_name: z.string().max(30, "First name must be 30 characters or less"),
  last_name: z.string().max(30, "Last name must be 30 characters or less")
});

type UserProfileValues = z.infer<typeof UserProfileSchema>;

const ChangePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    new_password1: z.string().min(1, "New password is required"),
    new_password2: z.string().min(1, "Please confirm your new password")
  })
  .refine((data) => data.new_password1 === data.new_password2, {
    message: "Passwords do not match",
    path: ["new_password2"]
  });

type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;

const ProfileTab = () => {
  const { user, setUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const form = useForm<UserProfileValues>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: { username: "", first_name: "", last_name: "" }
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { old_password: "", new_password1: "", new_password2: "" }
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username ?? "",
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? ""
      });
    }
  }, [user, form]);

  const onSubmit = async (values: UserProfileValues) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await authMeUpdate(values);
      setUser({ ...user!, ...updatedUser });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangePassword = async (values: ChangePasswordValues) => {
    setIsChangingPassword(true);
    try {
      await authPasswordChangeCreate(values);
      passwordForm.reset();
      toast.success("Password changed successfully");
    } catch {
      toast.error("Failed to change password. Please check your current password and try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your username and name.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
              <Button
                type="submit"
                className="hover:cursor-pointer"
                loading={isSubmitting}
              >
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="old_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="new_password1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="new_password2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="hover:cursor-pointer"
                loading={isChangingPassword}
              >
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

const AwsSesSchema = z.object({
  aws_access_key_id: z
    .string()
    .min(1, "Access Key ID is required")
    .max(255, "Must be 255 characters or less"),
  aws_secret_access_key: z.string().optional(),
  aws_region: z.string().max(50, "Must be 50 characters or less").optional(),
  sending_rate: z.number().positive("Must be a positive number").optional()
});

type AwsSesValues = z.infer<typeof AwsSesSchema>;

const productionStatusVariant = (
  status: SESConfiguration["production_status"]
): "default" | "secondary" | "destructive" => {
  if (status === "production") return "default";
  if (status === "sandbox") return "secondary";
  return "destructive";
};

const AwsSesTab = () => {
  const [config, setConfig] = useState<SESConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AwsSesValues>({
    resolver: zodResolver(AwsSesSchema),
    defaultValues: {
      aws_access_key_id: "",
      aws_secret_access_key: "",
      aws_region: "",
      sending_rate: undefined
    }
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sesySesConfigurationRetrieve();
        setConfig(data);
        form.reset({
          aws_access_key_id: data.aws_access_key_id ?? "",
          aws_secret_access_key: "",
          aws_region: data.aws_region ?? "",
          sending_rate: data.sending_rate ?? undefined
        });
      } catch {
        // No config yet — leave form at defaults
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [form]);

  const onSubmit = async (values: AwsSesValues) => {
    setIsSubmitting(true);
    try {
      const updated = await sesySesConfigurationUpdate({
        aws_access_key_id: values.aws_access_key_id,
        // Only send secret if filled in; cast needed because codegen marks it required despite schema
        ...(values.aws_secret_access_key
          ? { aws_secret_access_key: values.aws_secret_access_key }
          : {}),
        ...(values.aws_region ? { aws_region: values.aws_region } : {}),
        ...(values.sending_rate !== undefined
          ? { sending_rate: values.sending_rate }
          : {})
      } as Parameters<typeof sesySesConfigurationUpdate>[0]);
      setConfig(updated);
      form.setValue("aws_secret_access_key", "");
      toast.success("AWS SES configuration saved");
    } catch {
      toast.error("Failed to save configuration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>AWS SES Configuration</CardTitle>
        <CardDescription>
          Configure your Amazon Simple Email Service credentials and settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isLoading && config && (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Account status</p>
                <Badge
                  variant={productionStatusVariant(config.production_status)}
                >
                  {config.production_status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Credentials</p>
                <Badge
                  variant={config.config_valid ? "default" : "destructive"}
                >
                  {config.config_valid ? "Valid" : "Invalid"}
                </Badge>
              </div>
              {config.max_sending_rate !== null && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Max sending rate</p>
                  <p className="font-medium">
                    {config.max_sending_rate} emails/sec
                  </p>
                </div>
              )}
            </div>
            {config.production_status === "sandbox" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <span>
                    Your AWS SES account is in <strong>sandbox</strong> mode.
                    <br />
                    You will need to move the account to production before being
                    able to send campaigns.
                  </span>
                </AlertDescription>
              </Alert>
            )}
            <Separator />
          </>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="aws_access_key_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Key ID</FormLabel>
                  <FormControl>
                    <Input placeholder="AKIAIOSFODNN7EXAMPLE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aws_secret_access_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret Access Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        config ? "Leave blank to keep existing key" : ""
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {config
                      ? "Only fill this in if you want to update the secret key."
                      : "Your AWS secret access key."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aws_region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWS Region</FormLabel>
                  <FormControl>
                    <Input placeholder="us-east-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sending_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sending Rate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="14"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseFloat(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>Max emails per second.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="hover:cursor-pointer"
              loading={isSubmitting}
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const UsersTab = () => {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage users who have access to this project.
          <br />
          <br />
          This feature will be available soon.
        </CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
};

const Settings = () => {
  return (
    <SideBarLayout title="Settings">
      <div className="flex w-full justify-center overflow-y-auto py-6">
        <div className="w-full max-w-lg">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="aws-ses">AWS SES</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
            <TabsContent value="aws-ses">
              <AwsSesTab />
            </TabsContent>
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SideBarLayout>
  );
};

export default Settings;
