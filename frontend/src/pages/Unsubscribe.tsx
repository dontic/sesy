import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CenteredLayout from "@/layouts/CenteredLayout";
import { sesyProjectsUnsubscribeCreate } from "@/api/django/unsubscribe/unsubscribe";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const projectParam = searchParams.get("project") ?? "";
  const projectPk = parseInt(projectParam, 10);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isValid = email && !isNaN(projectPk);

  const handleUnsubscribe = async () => {
    setStatus("loading");
    try {
      await sesyProjectsUnsubscribeCreate(projectPk, { email });
      setStatus("success");
    } catch {
      setErrorMessage("Something went wrong. Please try again later.");
      setStatus("error");
    }
  };

  if (!isValid) {
    return (
      <CenteredLayout>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-sm text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
        </div>
      </CenteredLayout>
    );
  }

  if (status === "success") {
    return (
      <CenteredLayout>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-bold">Unsubscribed</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{email}</span> has been successfully unsubscribed. You will no longer receive emails from us.
          </p>
        </div>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout>
      <div className="flex flex-col items-center justify-center gap-4 text-center max-w-sm">
        <h1 className="text-2xl font-bold">Unsubscribe</h1>
        <p className="text-sm text-muted-foreground">
          You are about to unsubscribe <span className="font-medium text-foreground">{email}</span> from our mailing list. You will no longer receive emails from us.
        </p>
        {status === "error" && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
        <Button
          onClick={handleUnsubscribe}
          disabled={status === "loading"}
          variant="destructive"
        >
          {status === "loading" ? "Unsubscribing..." : "Confirm Unsubscribe"}
        </Button>
      </div>
    </CenteredLayout>
  );
};

export default Unsubscribe;
