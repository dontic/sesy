import { useState } from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export interface TempCredentials {
  username: string;
  temp_password: string;
  // Whether the credentials belong to a newly created user or a password reset
  reason: "created" | "reset";
}

interface Props {
  credentials: TempCredentials | null;
  onClose: () => void;
}

const CopyField = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
        <code className="flex-1 font-mono text-sm break-all select-all">{value}</code>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy"
          className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground hover:cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

const TempPasswordDialog = ({ credentials, onClose }: Props) => {
  return (
    <Dialog open={!!credentials} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {credentials && (
          <>
            <DialogHeader>
              <DialogTitle>
                {credentials.reason === "created" ? "User created" : "Password reset"}
              </DialogTitle>
              <DialogDescription>
                Share these credentials with <strong>{credentials.username}</strong>.
                They will be asked to choose a new password when they sign in.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <CopyField label="Username" value={credentials.username} />
              <CopyField label="Temporary password" value={credentials.temp_password} />
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This password won't be shown again. If it gets lost, reset the
                  password to generate a new one.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button className="hover:cursor-pointer" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TempPasswordDialog;
