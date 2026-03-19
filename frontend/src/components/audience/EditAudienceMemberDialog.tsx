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
import {
  sesyProjectsMembersUpdate,
} from "@/api/django/audience-members/audience-members";
import { sesyProjectsTagsList } from "@/api/django/tags/tags";
import type { AudienceMember, Tag } from "@/api/django/djangoAPI.schemas";

interface Props {
  member: AudienceMember;
  projectPk: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: AudienceMember) => void;
}

const EditAudienceMemberDialog = ({
  member,
  projectPk,
  open,
  onOpenChange,
  onSaved,
}: Props) => {
  const [email, setEmail] = useState(member.email);
  const [firstName, setFirstName] = useState(member.first_name ?? "");
  const [lastName, setLastName] = useState(member.last_name ?? "");
  const [subscribed, setSubscribed] = useState(member.subscribed ?? false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    (member.tags ?? []).map(String)
  );
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmail(member.email);
    setFirstName(member.first_name ?? "");
    setLastName(member.last_name ?? "");
    setSubscribed(member.subscribed ?? false);
    setSelectedTagIds((member.tags ?? []).map(String));
  }, [member]);

  useEffect(() => {
    if (!open) return;
    sesyProjectsTagsList(projectPk).then(setAvailableTags);
  }, [open, projectPk]);

  const handleSave = () => {
    setSaving(true);
    sesyProjectsMembersUpdate(projectPk, String(member.pk), {
      email,
      first_name: firstName,
      last_name: lastName,
      subscribed,
      tags: selectedTagIds.map(Number),
    })
      .then((updated) => {
        onSaved(updated);
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Audience Member</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last-name">Last Name</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tags</Label>
            <MultiSelect
              values={selectedTagIds}
              onValuesChange={setSelectedTagIds}
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Select tags..." />
              </MultiSelectTrigger>
              <MultiSelectContent search={{ placeholder: "Search tags...", emptyMessage: "No tags found." }}>
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

          <div className="flex items-center gap-3">
            <Switch
              id="subscribed"
              checked={subscribed}
              onCheckedChange={setSubscribed}
            />
            <Label htmlFor="subscribed">Subscribed</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAudienceMemberDialog;
