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
import { AlertTriangle, Copy, Check, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
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
import {
  sesyProjectsDomainRetrieve,
  sesyProjectsDomainCreate,
  sesyProjectsDomainDestroy
} from "@/api/django/verified-domains/verified-domains";
import type {
  SESConfiguration,
  VerifiedDomain
} from "@/api/django/djangoAPI.schemas";
import { useProjectStore } from "@/stores/ProjectStore";
import {
  sesyApiKeysList,
  sesyApiKeysCreate,
  sesyApiKeysDestroy
} from "@/api/django/api-key/api-key";
import type { ApiKey } from "@/api/django/djangoAPI.schemas";

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  status: "present" | "missing";
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      type="button"
      title="Copy"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

const UserProfileSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(150, "Username must be 150 characters or less")
    .regex(
      /^[\w.@+-]+$/,
      "Enter a valid username. Letters, digits and @/./+/-/_ only."
    ),
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
      toast.error(
        "Failed to change password. Please check your current password and try again."
      );
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
            <form
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
              className="space-y-4"
            >
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
): "success" | "destructive" | "secondary" => {
  if (status === "production") return "success";
  if (status === "sandbox") return "destructive";
  return "secondary";
};

const AddDomainSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(255, "Must be 255 characters or less")
});

type AddDomainValues = z.infer<typeof AddDomainSchema>;

const VerifiedDomainSection = ({
  projectPk,
  onDomainChange
}: {
  projectPk: number;
  onDomainChange: (domain: VerifiedDomain | null) => void;
}) => {
  const [domain, setDomain] = useState<VerifiedDomain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<AddDomainValues>({
    resolver: zodResolver(AddDomainSchema),
    defaultValues: { domain: "" }
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sesyProjectsDomainRetrieve(projectPk);
        setDomain(data);
        onDomainChange(data);
      } catch {
        setDomain(null);
        onDomainChange(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [projectPk, onDomainChange]);

  const onSubmit = async (values: AddDomainValues) => {
    setIsSubmitting(true);
    try {
      const data = await sesyProjectsDomainCreate(projectPk, {
        domain: values.domain
      });
      setDomain(data);
      onDomainChange(data);
      toast.success("Domain added successfully");
    } catch {
      toast.error("Failed to add domain. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);
    try {
      await sesyProjectsDomainDestroy(projectPk);
      setDomain(null);
      onDomainChange(null);
      toast.success("Domain removed successfully");
    } catch {
      toast.error("Failed to remove domain. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return null;

  const dnsRecords = domain
    ? (domain.dns_records as unknown as DnsRecord[])
    : [];
  const hasMissingRecords = dnsRecords.some((r) => r.status === "missing");

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Verified Domain</CardTitle>
        <CardDescription>
          Configure a sending domain to improve deliverability.
          <br />
          <br />
          This is the domain of the current project. To see the domains of other
          projects, please select the project in the project selector (top left)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!domain ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
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
                Add Domain
              </Button>
            </form>
          </Form>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium flex items-center gap-1">
                {domain.domain}
                <CopyButton text={domain.domain} />
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    domain.status === "verified" ? "success" : "destructive"
                  }
                >
                  {domain.status}
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:cursor-pointer"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove domain?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove <strong>{domain.domain}</strong> from
                        this project. You will need to re-add and re-verify it
                        if you want to use it again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {hasMissingRecords && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Some DNS records are missing. Please create the missing
                  records in your domain registrar to complete verification.
                </AlertDescription>
              </Alert>
            )}

            {dnsRecords.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">DNS Records</p>
                  {dnsRecords.map((record, i) => (
                    <div
                      key={i}
                      className="rounded-md border p-3 space-y-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{record.type}</Badge>
                        <Badge
                          variant={
                            record.status === "present"
                              ? "success"
                              : "destructive"
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Name</p>
                        <p className="font-mono text-xs break-all flex items-start gap-1">
                          <span className="flex-1">
                            {record.name.replace(`.${domain.domain}`, "")}
                          </span>
                          <CopyButton
                            text={record.name.replace(`.${domain.domain}`, "")}
                          />
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Value</p>
                        <p className="font-mono text-xs break-all flex items-start gap-1">
                          <span className="flex-1">{record.value}</span>
                          <CopyButton text={record.value} />
                        </p>
                      </div>
                      {record.priority !== undefined && (
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">
                            Priority
                          </p>
                          <p className="font-mono text-xs flex items-center gap-1">
                            {record.priority}
                            <CopyButton text={String(record.priority)} />
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const AwsSesTab = () => {
  const { currentProject } = useProjectStore();
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
    <div className="space-y-6">
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
                    variant={config.config_valid ? "success" : "destructive"}
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
                      You will need to move the account to production before
                      being able to send campaigns.
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

      {!isLoading && config?.config_valid && currentProject && (
        <VerifiedDomainSection
          projectPk={currentProject.pk}
          onDomainChange={() => {}}
        />
      )}
    </div>
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

const API_BASE_URL = import.meta.env.DEV ? "http://localhost:8000" : `${window.location.origin}/api`;

const ApiDocsSection = ({ apiKey }: { apiKey: ApiKey | undefined }) => {
  const exampleKey = apiKey?.key ?? "<your-api-key>";
  const exampleBody = JSON.stringify(
    {
      project_pk: 1,
      email: "user@example.com",
      first_name: "Jane",
      last_name: "Doe",
      subscribed: true,
      tags: ["newsletter", "vip"]
    },
    null,
    2
  );
  const curlExample = `curl -X POST ${API_BASE_URL}/sesy/public/members/ \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${exampleKey}" \\
  -d '${JSON.stringify({ project_pk: 1, email: "user@example.com" })}'`;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>API Reference</CardTitle>
        <CardDescription>
          Use the public API to programmatically add audience members.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        {/* Endpoint */}
        <div className="space-y-2">
          <p className="font-medium">Add Audience Member</p>
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 font-mono text-xs">
            <Badge variant="outline" className="shrink-0">POST</Badge>
            <span className="break-all">{API_BASE_URL}/sesy/public/members/</span>
            <CopyButton text={`${API_BASE_URL}/sesy/public/members/`} />
          </div>
          <p className="text-muted-foreground text-xs">
            Creates an audience member in a project. Tags are created
            automatically if they don't exist.
          </p>
        </div>

        <Separator />

        {/* Authentication */}
        <div className="space-y-2">
          <p className="font-medium">Authentication</p>
          <div className="rounded-md border bg-muted px-3 py-2 font-mono text-xs flex items-start gap-1">
            <span className="flex-1 break-all">X-API-Key: {exampleKey}</span>
            <CopyButton text={`X-API-Key: ${exampleKey}`} />
          </div>
        </div>

        <Separator />

        {/* Request body */}
        <div className="space-y-2">
          <p className="font-medium">Request Body</p>
          <div className="rounded-md border overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Field</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-left px-3 py-2 font-medium">Required</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { field: "project_pk", type: "integer", required: true },
                  { field: "email", type: "string (email)", required: true },
                  { field: "first_name", type: "string", required: false },
                  { field: "last_name", type: "string", required: false },
                  { field: "subscribed", type: "boolean", required: false },
                  { field: "tags", type: "string[]", required: false }
                ].map(({ field, type, required }) => (
                  <tr key={field}>
                    <td className="px-3 py-2 font-mono">{field}</td>
                    <td className="px-3 py-2 text-muted-foreground">{type}</td>
                    <td className="px-3 py-2">
                      {required ? (
                        <Badge variant="secondary" className="text-xs">required</Badge>
                      ) : (
                        <span className="text-muted-foreground">optional</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        {/* Example */}
        <div className="space-y-2">
          <p className="font-medium">Example Request Body</p>
          <div className="relative rounded-md border bg-muted p-3 font-mono text-xs">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all">
              {exampleBody}
            </pre>
            <span className="absolute top-2 right-2">
              <CopyButton text={exampleBody} />
            </span>
          </div>
        </div>

        <Separator />

        {/* cURL */}
        <div className="space-y-2">
          <p className="font-medium">cURL Example</p>
          <div className="relative rounded-md border bg-muted p-3 font-mono text-xs">
            <pre className="overflow-x-auto whitespace-pre-wrap break-all">
              {curlExample}
            </pre>
            <span className="absolute top-2 right-2">
              <CopyButton text={curlExample} />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ApiTab = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sesyApiKeysList();
        setApiKeys(data);
      } catch {
        setApiKeys([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const data = await sesyApiKeysCreate({ name: newKeyName });
      setApiKeys((prev) => [...prev, data]);
      setNewKeyName("");
      toast.success("API key created");
    } catch {
      toast.error("Failed to create API key. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await sesyApiKeysDestroy(id);
      setApiKeys((prev) => prev.filter((k) => k.pk !== id));
      toast.success("API key deleted");
    } catch {
      toast.error("Failed to delete API key. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys used to authenticate requests to the Sesy API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {!isLoading && apiKeys.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No API keys yet. Create one to get started.
            </p>
          )}
          {!isLoading && apiKeys.length > 0 && (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.pk} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{key.name || `Key #${key.pk}`}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:cursor-pointer"
                          disabled={deletingId === key.pk}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the key{key.name ? ` "${key.name}"` : ""}. Any
                            integrations using it will stop working immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(key.pk)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                    <code className="flex-1 text-xs font-mono break-all select-all">
                      {key.key}
                    </code>
                    <CopyButton text={key.key} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created by {key.created_by} · {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g. Production)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isCreating && handleCreate()}
              className="flex-1"
            />
            <Button
              className="hover:cursor-pointer"
              loading={isCreating}
              disabled={isLoading || !newKeyName.trim()}
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>
        </CardContent>
      </Card>
      <ApiDocsSection apiKey={apiKeys[0]} />
    </div>
  );
};

const Settings = () => {
  return (
    <SideBarLayout title="Settings">
      <div className="flex w-full justify-center overflow-y-auto py-6">
        <div className="w-full max-w-2xl">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="aws-ses">AWS SES</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
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
            <TabsContent value="api">
              <ApiTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SideBarLayout>
  );
};

export default Settings;
