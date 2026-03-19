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
import { sesyProjectsCampaignsSendCreate } from "@/api/django/campaigns/campaigns";
import type { Campaign } from "@/api/django/djangoAPI.schemas";

interface Props {
  campaign: Campaign;
  projectPk: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: (campaign: Campaign) => void;
}

const SendCampaignDialog = ({
  campaign,
  projectPk,
  open,
  onOpenChange,
  onSent,
}: Props) => {
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    sesyProjectsCampaignsSendCreate(projectPk, String(campaign.pk))
      .then((updated) => {
        onSent(updated);
        onOpenChange(false);
      })
      .finally(() => setSending(false));
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Campaign</AlertDialogTitle>
          <AlertDialogDescription>
            You're about to send <strong>{campaign.name}</strong> to{" "}
            {campaign.send_to_all
              ? "all subscribed audience members"
              : `members with ${campaign.tags_detail.length} tag(s)`}
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : "Send Now"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SendCampaignDialog;
