import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { sesyProjectsMembersDestroy } from "@/api/django/audience-members/audience-members";
import type { AudienceMember } from "@/api/django/djangoAPI.schemas";

interface Props {
  member: AudienceMember;
  projectPk: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (pk: number) => void;
}

const DeleteAudienceMemberDialog = ({
  member,
  projectPk,
  open,
  onOpenChange,
  onDeleted,
}: Props) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    sesyProjectsMembersDestroy(projectPk, String(member.pk))
      .then(() => {
        onDeleted(member.pk);
        onOpenChange(false);
      })
      .finally(() => setDeleting(false));
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Audience Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{member.email}</span>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAudienceMemberDialog;
