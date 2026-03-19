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
import { sesyProjectsCampaignsCreate } from "@/api/django/campaigns/campaigns";
import { sesyProjectsTagsList } from "@/api/django/tags/tags";
import type { Campaign, Tag } from "@/api/django/djangoAPI.schemas";

interface Props {
  projectPk: string;
  projectDomain: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (campaign: Campaign) => void;
}

const CreateCampaignDialog = ({
  projectPk,
  projectDomain,
  open,
  onOpenChange,
  onCreated,
}: Props) => {
  const [name, setName] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmailPrefix, setFromEmailPrefix] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    sesyProjectsTagsList(projectPk).then(setAvailableTags);
  }, [open, projectPk]);

  const reset = () => {
    setName("");
    setFromName("");
    setFromEmailPrefix("");
    setSubject("");
    setHtmlBody("");
    setSendToAll(true);
    setSelectedTagIds([]);
  };

  const handleCreate = () => {
    setSaving(true);
    sesyProjectsCampaignsCreate(projectPk, {
      name,
      from_name: fromName,
      from_email: `${fromEmailPrefix}@${projectDomain}`,
      subject,
      html_body: htmlBody,
      send_to_all: sendToAll,
      tags: sendToAll ? [] : selectedTagIds.map(Number),
    })
      .then((created) => {
        onCreated(created);
        onOpenChange(false);
        reset();
      })
      .finally(() => setSaving(false));
  };

  const isValid = name && fromEmailPrefix && subject && htmlBody;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="campaign-name">Campaign Name *</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. March Newsletter"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-from-name">From Name</Label>
              <Input
                id="campaign-from-name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-from-email">From Email *</Label>
              <div className="flex h-9 w-full rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <input
                  id="campaign-from-email"
                  type="text"
                  value={fromEmailPrefix}
                  onChange={(e) => setFromEmailPrefix(e.target.value)}
                  placeholder="hello"
                  className="flex-1 min-w-0 px-3 py-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                />
                <span className="flex items-center px-3 bg-muted border-l border-input text-sm text-muted-foreground whitespace-nowrap">
                  @{projectDomain}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="campaign-subject">Subject *</Label>
            <Input
              id="campaign-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your monthly update is here"
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
              />
            </div>

            {!sendToAll && (
              <div className="flex flex-col gap-1.5">
                <Label>Target Tags</Label>
                <MultiSelect
                  values={selectedTagIds}
                  onValuesChange={setSelectedTagIds}
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
            <RichTextEditor value={htmlBody} onChange={setHtmlBody} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving || !isValid}>
            {saving ? "Creating..." : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;
