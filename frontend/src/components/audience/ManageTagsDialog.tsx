import { useEffect, useState } from "react";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  sesyProjectsTagsCreate,
  sesyProjectsTagsDestroy,
  sesyProjectsTagsList,
  sesyProjectsTagsUpdate,
} from "@/api/django/tags/tags";
import type { Tag } from "@/api/django/djangoAPI.schemas";

interface Props {
  projectPk: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageTagsDialog = ({ projectPk, open, onOpenChange }: Props) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingPk, setEditingPk] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingPk, setSavingPk] = useState<number | null>(null);
  const [deletingPk, setDeletingPk] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    sesyProjectsTagsList(projectPk).then(setTags);
  }, [open, projectPk]);

  const handleAdd = () => {
    if (!newTagName.trim()) return;
    setAdding(true);
    sesyProjectsTagsCreate(projectPk, { name: newTagName.trim() })
      .then((tag) => {
        setTags((prev) => [...prev, tag]);
        setNewTagName("");
      })
      .finally(() => setAdding(false));
  };

  const startEdit = (tag: Tag) => {
    setEditingPk(tag.pk);
    setEditingName(tag.name);
  };

  const cancelEdit = () => {
    setEditingPk(null);
    setEditingName("");
  };

  const handleSaveEdit = (pk: number) => {
    if (!editingName.trim()) return;
    setSavingPk(pk);
    sesyProjectsTagsUpdate(projectPk, String(pk), { name: editingName.trim() })
      .then((updated) => {
        setTags((prev) => prev.map((t) => (t.pk === pk ? updated : t)));
        setEditingPk(null);
      })
      .finally(() => setSavingPk(null));
  };

  const handleDelete = (pk: number) => {
    setDeletingPk(pk);
    sesyProjectsTagsDestroy(projectPk, String(pk))
      .then(() => setTags((prev) => prev.filter((t) => t.pk !== pk)))
      .finally(() => setDeletingPk(null));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Add new tag */}
          <div className="flex gap-2">
            <Input
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={adding || !newTagName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tag list */}
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tags yet.
              </p>
            ) : (
              tags.map((tag) =>
                editingPk === tag.pk ? (
                  <div key={tag.pk} className="flex items-center gap-2">
                    <Input
                      className="h-8 text-sm"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(tag.pk);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleSaveEdit(tag.pk)}
                      disabled={savingPk === tag.pk}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    key={tag.pk}
                    className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted"
                  >
                    <span className="text-sm">{tag.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEdit(tag)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(tag.pk)}
                        disabled={deletingPk === tag.pk}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTagsDialog;
