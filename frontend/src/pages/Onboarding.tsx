import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
  FormMessage
} from "@/components/ui/form";

import { useUserStore } from "@/stores/UserStore";
import { authMeUpdate, authPasswordChangeCreate } from "@/api/django/auth/auth";
import {
  sesySesConfigurationUpdate
} from "@/api/django/ses-configuration/ses-configuration";
import { sesyProjectsCreate, sesyProjectsList } from "@/api/django/projects/projects";
import {
  sesyProjectsDomainCreate,
  sesyProjectsDomainRetrieve
} from "@/api/django/verified-domains/verified-domains";
import { sesyOnboardingRetrieve } from "@/api/django/onboarding/onboarding";
import type {
  OnboardingResponse,
  VerifiedDomain
} from "@/api/django/djangoAPI.schemas";

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  status: "present" | "missing";
}

/* -------------------------------------------------------------------------- */
/*                              Step definitions                              */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { label: "Profile" },
  { label: "Password" },
  { label: "Project" },
  { label: "AWS SES" },
  { label: "Domain" }
];

function getOnboardingStep(status: OnboardingResponse): number {
  if (!status.username_changed) return 1;
  if (!status.password_changed) return 2;
  if (!status.project_created) return 3;
  if (!status.ses_configured) return 4;
  if (!status.domain_configured) return 5;
  return 6;
}

/* -------------------------------------------------------------------------- */
/*                            Step progress bar                               */
/* -------------------------------------------------------------------------- */

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${isDone ? "bg-primary text-primary-foreground" : ""}
                  ${isActive ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : ""}
                  ${!isDone && !isActive ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                className={`text-xs hidden sm:block ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-8 sm:w-12 mx-1 mb-5 ${stepNum < currentStep ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Step 1 – Username                            */
/* -------------------------------------------------------------------------- */

const UsernameSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(150, "Username must be 150 characters or less")
    .regex(
      /^[\w.@+-]+$/,
      "Letters, digits and @/./+/-/_ only."
    ),
  first_name: z.string().max(30, "Must be 30 characters or less").optional(),
  last_name: z.string().max(30, "Must be 30 characters or less").optional()
});

function StepUsername({ onComplete }: { onComplete: () => void }) {
  const { user, setUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof UsernameSchema>>({
    resolver: zodResolver(UsernameSchema),
    defaultValues: {
      username: user?.username ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? ""
    }
  });

  const onSubmit = async (values: z.infer<typeof UsernameSchema>) => {
    setIsSubmitting(true);
    try {
      const updated = await authMeUpdate({
        username: values.username,
        ...(values.first_name !== undefined ? { first_name: values.first_name } : {}),
        ...(values.last_name !== undefined ? { last_name: values.last_name } : {})
      });
      setUser({ ...user!, ...updated });
      toast.success("Username updated");
      onComplete();
    } catch {
      toast.error("Failed to update username. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Set up your profile</CardTitle>
        <CardDescription>
          The default username is <strong>admin</strong>. Choose a unique
          username and add your name.
        </CardDescription>
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
                  <FormLabel>First Name (optional)</FormLabel>
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
                  <FormLabel>Last Name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Save Profile
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Step 2 – Password                            */
/* -------------------------------------------------------------------------- */

const PasswordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required"),
    new_password1: z.string().min(8, "Password must be at least 8 characters"),
    new_password2: z.string().min(1, "Please confirm your new password")
  })
  .refine((data) => data.new_password1 === data.new_password2, {
    message: "Passwords do not match",
    path: ["new_password2"]
  });

function StepPassword({ onComplete }: { onComplete: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof PasswordSchema>>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { old_password: "", new_password1: "", new_password2: "" }
  });

  const onSubmit = async (values: z.infer<typeof PasswordSchema>) => {
    setIsSubmitting(true);
    try {
      await authPasswordChangeCreate(values);
      toast.success("Password updated");
      onComplete();
    } catch {
      toast.error("Failed to change password. Please check your current password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Change your password</CardTitle>
        <CardDescription>
          The default password is <strong>admin</strong>. Set a strong password
          to secure your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="old_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="new_password1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
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
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Step 3 – Project                              */
/* -------------------------------------------------------------------------- */

const ProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Must be 255 characters or less"),
  description: z.string().optional()
});

function StepProject({ onComplete }: { onComplete: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof ProjectSchema>>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: { name: "", description: "" }
  });

  const onSubmit = async (values: z.infer<typeof ProjectSchema>) => {
    setIsSubmitting(true);
    try {
      await sesyProjectsCreate({
        name: values.name,
        ...(values.description ? { description: values.description } : {})
      });
      toast.success("Project created");
      onComplete();
    } catch {
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Create your first project</CardTitle>
        <CardDescription>
          Projects group your campaigns and audience. Create one to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Newsletter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="A short description…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Create Project
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Step 4 – AWS SES                               */
/* -------------------------------------------------------------------------- */

const SesSchema = z.object({
  aws_access_key_id: z
    .string()
    .min(1, "Access Key ID is required")
    .max(255, "Must be 255 characters or less"),
  aws_secret_access_key: z
    .string()
    .min(1, "Secret Access Key is required"),
  aws_region: z.string().min(1, "AWS region is required").max(50, "Must be 50 characters or less")
});

function StepSes({ onComplete }: { onComplete: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsInvalid, setCredentialsInvalid] = useState(false);

  const form = useForm<z.infer<typeof SesSchema>>({
    resolver: zodResolver(SesSchema),
    defaultValues: { aws_access_key_id: "", aws_secret_access_key: "", aws_region: "us-east-1" }
  });

  const onSubmit = async (values: z.infer<typeof SesSchema>) => {
    setIsSubmitting(true);
    setCredentialsInvalid(false);
    try {
      const result = await sesySesConfigurationUpdate({
        aws_access_key_id: values.aws_access_key_id,
        aws_secret_access_key: values.aws_secret_access_key,
        aws_region: values.aws_region
      } as Parameters<typeof sesySesConfigurationUpdate>[0]);

      if (!result.config_valid) {
        setCredentialsInvalid(true);
        return;
      }

      toast.success("AWS SES configured");
      onComplete();
    } catch {
      toast.error("Failed to save SES configuration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Configure AWS SES</CardTitle>
        <CardDescription>
          Connect your AWS SES account to send emails. You can update these
          credentials later in Settings.{" "}
          <a
            href="https://github.com/dontic/sesy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-foreground hover:text-primary"
          >
            View setup documentation
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credentialsInvalid && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The credentials could not be validated. Please check your AWS
              Access Key ID, Secret Access Key, and region and try again.
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="aws_access_key_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWS Access Key ID</FormLabel>
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
                  <FormLabel>AWS Secret Access Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      {...field}
                    />
                  </FormControl>
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
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Save Configuration
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Step 5 – Domain                               */
/* -------------------------------------------------------------------------- */

const DomainSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(255, "Must be 255 characters or less")
});

function DnsRecordsList({ domain }: { domain: VerifiedDomain }) {
  const dnsRecords = (domain.dns_records as unknown as DnsRecord[]) ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add the following DNS records at your domain registrar to verify{" "}
        <strong>{domain.domain}</strong>.
      </p>

      {dnsRecords.length > 0 && (
        <div className="space-y-3">
          {dnsRecords.map((record, i) => (
            <div key={i} className="rounded-md border p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{record.type}</Badge>
                <Badge
                  variant={
                    record.status === "present" ? "success" : "destructive"
                  }
                >
                  {record.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="font-mono text-xs break-all">
                  {record.name.replace(`.${domain.domain}`, "")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Value</p>
                <p className="font-mono text-xs break-all">{record.value}</p>
              </div>
              {record.priority !== undefined && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Priority</p>
                  <p className="font-mono text-xs">{record.priority}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepDomain() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [projectPk, setProjectPk] = useState<number | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [domain, setDomain] = useState<VerifiedDomain | null>(null);

  const form = useForm<z.infer<typeof DomainSchema>>({
    resolver: zodResolver(DomainSchema),
    defaultValues: { domain: "" }
  });

  useEffect(() => {
    sesyProjectsList()
      .then((projects) => {
        if (projects.length > 0) setProjectPk(projects[0].pk);
      })
      .catch(() => {
        toast.error("Could not load project. Please refresh the page.");
      })
      .finally(() => setIsLoadingProject(false));
  }, []);

  const onSubmit = async (values: z.infer<typeof DomainSchema>) => {
    if (!projectPk) return;
    setIsSubmitting(true);
    try {
      const created = await sesyProjectsDomainCreate(projectPk, {
        domain: values.domain
      });
      setDomain(created);
    } catch {
      toast.error("Failed to configure domain. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecheck = async () => {
    if (!projectPk) return;
    setIsRechecking(true);
    try {
      const updated = await sesyProjectsDomainRetrieve(projectPk);
      setDomain(updated);
      toast.success("DNS records refreshed");
    } catch {
      toast.error("Failed to refresh DNS records. Please try again.");
    } finally {
      setIsRechecking(false);
    }
  };

  if (isLoadingProject) {
    return (
      <>
        <CardHeader>
          <CardTitle>Set up your sending domain</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading project…</p>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Set up your sending domain</CardTitle>
        <CardDescription>
          {domain
            ? "Add these DNS records at your registrar to verify your domain."
            : "Add a domain to send emails from. You will need to add DNS records at your registrar to verify it."}
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
                className="w-full"
                loading={isSubmitting}
                disabled={!projectPk}
              >
                Add Domain
              </Button>
            </form>
          </Form>
        ) : (
          <>
            <DnsRecordsList domain={domain} />
            <Separator />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRecheck}
                loading={isRechecking}
              >
                Re-check DNS records
              </Button>
              <Button
                className="w-full"
                onClick={() => navigate("/campaigns", { replace: true })}
              >
                Complete later in Settings
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Main Onboarding page                            */
/* -------------------------------------------------------------------------- */

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  const loadStatus = async () => {
    try {
      const status = await sesyOnboardingRetrieve();
      const step = getOnboardingStep(status);
      if (step > 5) {
        navigate("/campaigns", { replace: true });
      } else {
        setCurrentStep(step);
      }
    } catch {
      toast.error("Failed to load onboarding status. Please refresh.");
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleStepComplete = () => {
    if (currentStep === 5) {
      navigate("/campaigns", { replace: true });
    } else {
      loadStatus();
    }
  };

  if (currentStep === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Sesy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete setup to start sending emails
          </p>
        </div>

        <StepProgress currentStep={currentStep} />

        <Card>
          {currentStep === 1 && <StepUsername onComplete={handleStepComplete} />}
          {currentStep === 2 && <StepPassword onComplete={handleStepComplete} />}
          {currentStep === 3 && <StepProject onComplete={handleStepComplete} />}
          {currentStep === 4 && <StepSes onComplete={handleStepComplete} />}
          {currentStep === 5 && <StepDomain />}
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
