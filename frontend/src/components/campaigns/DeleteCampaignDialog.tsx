import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sesyProjectsCampaignsDestroy } from "@/api/django/campaigns/campaigns";
import type { Campaign } from "@/api/django/djangoAPI.schemas";

interface Props {
  campaign: Campaign;
  projectPk: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (pk: number) => void;
}

const DeleteCampaignDialog = ({
  campaign,
  projectPk,
  open,
  onOpenChange,
  onDeleted,
}: Props) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    sesyProjectsCampaignsDestroy(projectPk, String(campaign.pk))
      .then(() => {
        onDeleted(campaign.pk);
        onOpenChange(false);
      })
      .finally(() => setDeleting(false));
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{campaign.name}</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCampaignDialog;
