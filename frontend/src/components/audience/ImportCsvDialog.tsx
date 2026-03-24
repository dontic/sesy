import { useEffect, useRef, useState } from "react";

import { Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  sesyProjectsMembersUploadCsvCreate,
  sesyTasksRetrieve
} from "@/api/django/audience-members/audience-members";
import { SesyTasksRetrieve200Status } from "@/api/django/djangoAPI.schemas";

interface Props {
  projectPk: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type TaskStatus = {
  status: keyof typeof SesyTasksRetrieve200Status;
  processed: number;
  total: number;
  created: number;
  skipped: number;
};

const ImportCsvDialog = ({
  projectPk,
  open,
  onOpenChange,
  onImported
}: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pollTask = (taskId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await sesyTasksRetrieve(taskId);
        const status = res.status as keyof typeof SesyTasksRetrieve200Status;
        setTaskStatus({
          status,
          processed: res.processed ?? 0,
          total: res.total ?? 0,
          created: res.created ?? 0,
          skipped: res.skipped ?? 0
        });

        if (status === "succeeded" || status === "failed") {
          stopPolling();
          if (status === "succeeded") onImported();
        }
      } catch {
        stopPolling();
        setError("Lost connection while tracking import. Please check back later.");
        setUploading(false);
      }
    }, 1000);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setTaskStatus(null);

    try {
      const res = await sesyProjectsMembersUploadCsvCreate(projectPk, { file });
      if (!res.task_id) throw new Error("No task_id returned");
      setTaskStatus({ status: "pending", processed: 0, total: 0, created: 0, skipped: 0 });
      pollTask(res.task_id);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        setError(
          'Invalid CSV format. Make sure the file contains a valid "email" header (case-sensitive) and follows the format described above.'
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      clearFile();
      setUploading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      stopPolling();
      setFile(null);
      setTaskStatus(null);
      setError(null);
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
    onOpenChange(open);
  };

  const isProcessing =
    taskStatus?.status === "pending" || taskStatus?.status === "in_progress";
  const isDone =
    taskStatus?.status === "succeeded" || taskStatus?.status === "failed";
  const progressPercent =
    taskStatus && taskStatus.total > 0
      ? Math.round((taskStatus.processed / taskStatus.total) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Audience Members from CSV</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Alert>
            <AlertDescription>
              The CSV file must contain exactly these headers (case-sensitive):{" "}
              <ul className="list-disc list-inside font-mono font-semibold">
                <li>
                  <span className="font-bold">email</span>{" "}
                  <span className="text-xs">(required)</span>
                </li>
                <li>
                  <span className="font-bold">first_name</span>{" "}
                  <span className="text-xs">(optional)</span>
                </li>
                <li>
                  <span className="font-bold">last_name</span>{" "}
                  <span className="text-xs">(optional)</span>
                </li>
                <li>
                  <span className="font-bold">tags</span>{" "}
                  <span className="text-xs">
                    (optional, comma separated, i.e. "tag 1, tag 2")
                  </span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">
                {taskStatus?.status === "pending"
                  ? "Queued, waiting to start..."
                  : taskStatus?.total > 0
                    ? `Processing ${taskStatus.processed} of ${taskStatus.total} contacts...`
                    : "Processing..."}
              </div>
              {taskStatus?.total > 0 && (
                <Progress value={progressPercent} className="h-2" />
              )}
            </div>
          )}

          {taskStatus?.status === "succeeded" && (
            <div className="text-sm text-muted-foreground">
              Import complete: <strong>{taskStatus.created}</strong> added,{" "}
              <strong>{taskStatus.skipped}</strong> skipped out of{" "}
              <strong>{taskStatus.total}</strong> rows.
            </div>
          )}

          {taskStatus?.status === "failed" && !error && (
            <Alert variant="destructive">
              <AlertDescription>
                The import failed. Please check your CSV file and try again.
              </AlertDescription>
            </Alert>
          )}

          {!isProcessing && !isDone && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="csv-file">CSV File</Label>
              <div className="flex gap-2">
                <Input
                  id="csv-file"
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {isDone ? "Close" : "Cancel"}
          </Button>
          {!isProcessing && !isDone && (
            <Button onClick={handleUpload} disabled={uploading || !file}>
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCsvDialog;
