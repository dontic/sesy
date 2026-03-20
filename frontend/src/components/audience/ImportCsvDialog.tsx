import { useRef, useState } from "react";

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
import { sesyProjectsMembersUploadCsvCreate } from "@/api/django/audience-members/audience-members";

interface Props {
  projectPk: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

const ImportCsvDialog = ({
  projectPk,
  open,
  onOpenChange,
  onImported
}: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    total_rows: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    sesyProjectsMembersUploadCsvCreate(projectPk, { file })
      .then((res) => {
        setResult({
          created: res.created ?? 0,
          skipped: res.skipped ?? 0,
          total_rows: res.total_rows ?? 0
        });
        onImported();
      })
      .finally(() => setUploading(false));
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setFile(null);
      setResult(null);
    }
    onOpenChange(open);
  };

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

          {result ? (
            <div className="text-sm text-muted-foreground">
              Import complete: <strong>{result.created}</strong> added,{" "}
              <strong>{result.skipped}</strong> skipped out of{" "}
              <strong>{result.total_rows}</strong> rows.
            </div>
          ) : (
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
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
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
