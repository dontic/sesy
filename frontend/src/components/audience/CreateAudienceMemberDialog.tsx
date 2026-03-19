import { useState } from "react";

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
import { Switch } from "@/components/ui/switch";
import { sesyProjectsMembersCreate } from "@/api/django/audience-members/audience-members";
import type { AudienceMember } from "@/api/django/djangoAPI.schemas";

interface Props {
  projectPk: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (member: AudienceMember) => void;
}

const CreateAudienceMemberDialog = ({
  projectPk,
  open,
  onOpenChange,
  onCreated,
}: Props) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [subscribed, setSubscribed] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    setSaving(true);
    sesyProjectsMembersCreate(projectPk, {
      email,
      first_name: firstName,
      last_name: lastName,
      subscribed,
    })
      .then((created) => {
        onCreated(created);
        onOpenChange(false);
        setEmail("");
        setFirstName("");
        setLastName("");
        setSubscribed(true);
      })
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Audience Member</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-first-name">First Name</Label>
            <Input
              id="create-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-last-name">Last Name</Label>
            <Input
              id="create-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="create-subscribed"
              checked={subscribed}
              onCheckedChange={setSubscribed}
            />
            <Label htmlFor="create-subscribed">Subscribed</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving || !email}>
            {saving ? "Adding..." : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAudienceMemberDialog;
