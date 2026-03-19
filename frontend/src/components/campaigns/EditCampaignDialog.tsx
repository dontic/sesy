import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "./RichTextEditor";
import { sesyProjectsCampaignsUpdate } from "@/api/django/campaigns/campaigns";
import { sesyProjectsTagsList } from "@/api/django/tags/tags";
import type { Campaign, Tag } from "@/api/django/djangoAPI.schemas";

interface Props {
  campaign: Campaign;
  projectPk: string;
  projectDomain: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (campaign: Campaign) => void;
}

const EditCampaignDialog = ({
  campaign,
  projectPk,
  projectDomain,
  open,
  onOpenChange,
  onSaved,
}: Props) => {
  const [name, setName] = useState(campaign.name);
  const [fromName, setFromName] = useState(campaign.from_name ?? "");
  const [fromEmailPrefix, setFromEmailPrefix] = useState(
    campaign.from_email.split("@")[0]
  );
  const [subject, setSubject] = useState(campaign.subject);
  const [htmlBody, setHtmlBody] = useState(campaign.html_body);
  const [sendToAll, setSendToAll] = useState(campaign.send_to_all ?? true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    (campaign.tags ?? []).map(String)
  );
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(campaign.name);
    setFromName(campaign.from_name ?? "");
    setFromEmailPrefix(campaign.from_email.split("@")[0]);
    setSubject(campaign.subject);
    setHtmlBody(campaign.html_body);
    setSendToAll(campaign.send_to_all ?? true);
    setSelectedTagIds((campaign.tags ?? []).map(String));
    sesyProjectsTagsList(projectPk).then(setAvailableTags);
  }, [open, campaign, projectPk]);

  const handleSave = () => {
    setSaving(true);
    sesyProjectsCampaignsUpdate(projectPk, String(campaign.pk), {
      name,
      from_name: fromName,
      from_email: `${fromEmailPrefix}@${projectDomain}`,
      subject,
      html_body: htmlBody,
      send_to_all: sendToAll,
      tags: sendToAll ? [] : selectedTagIds.map(Number),
    })
      .then((updated) => {
        onSaved(updated);
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  };

  const isValid = name && fromEmailPrefix && subject && htmlBody;
  const isSent = campaign.status === "sent" || campaign.status === "sending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-campaign-name">Campaign Name *</Label>
            <Input
              id="edit-campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSent}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-campaign-from-name">From Name</Label>
              <Input
                id="edit-campaign-from-name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                disabled={isSent}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-campaign-from-email">From Email *</Label>
              <div className="flex h-9 w-full rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <input
                  id="edit-campaign-from-email"
                  type="text"
                  value={fromEmailPrefix}
                  onChange={(e) => setFromEmailPrefix(e.target.value)}
                  disabled={isSent}
                  className="flex-1 min-w-0 px-3 py-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="flex items-center px-3 bg-muted border-l border-input text-sm text-muted-foreground whitespace-nowrap">
                  @{projectDomain}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-campaign-subject">Subject *</Label>
            <Input
              id="edit-campaign-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSent}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Send to all subscribers</p>
                <p className="text-xs text-muted-foreground">
                  {sendToAll
                    ? "Will send to all subscribed audience members"
                    : "Will send only to members with selected tags"}
                </p>
              </div>
              <Switch
                checked={sendToAll}
                onCheckedChange={setSendToAll}
                disabled={isSent}
              />
            </div>

            {!sendToAll && (
              <div className="flex flex-col gap-1.5">
                <Label>Target Tags</Label>
                <MultiSelect
                  values={selectedTagIds}
                  onValuesChange={isSent ? undefined : setSelectedTagIds}
                >
                  <MultiSelectTrigger className="w-full">
                    <MultiSelectValue placeholder="Select tags..." />
                  </MultiSelectTrigger>
                  <MultiSelectContent
                    search={{
                      placeholder: "Search tags...",
                      emptyMessage: "No tags found.",
                    }}
                  >
                    <MultiSelectGroup>
                      {availableTags.map((tag) => (
                        <MultiSelectItem key={tag.pk} value={String(tag.pk)}>
                          {tag.name}
                        </MultiSelectItem>
                      ))}
                    </MultiSelectGroup>
                  </MultiSelectContent>
                </MultiSelect>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Email Body *</Label>
              <span className="text-xs text-muted-foreground">
                Use {"{{first_name}}"} and {"{{last_name}}"} for personalization
              </span>
            </div>
            <RichTextEditor
              value={htmlBody}
              onChange={setHtmlBody}
              disabled={isSent}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !isValid || isSent}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCampaignDialog;
