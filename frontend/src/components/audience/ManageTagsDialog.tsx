import { useEffect, useState } from "react";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  sesyProjectsTagsCreate,
  sesyProjectsTagsDestroy,
  sesyProjectsTagsList,
  sesyProjectsTagsMergeCreate,
  sesyProjectsTagsUpdate,
} from "@/api/django/tags/tags";
import type { Tag } from "@/api/django/djangoAPI.schemas";

interface MergeInfo {
  sourcePk: number;
  sourceName: string;
  targetPk: number;
  targetName: string;
}

interface Props {
  projectPk: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const ManageTagsDialog = ({ projectPk, open, onOpenChange, onChanged }: Props) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingPk, setEditingPk] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingPk, setSavingPk] = useState<number | null>(null);
  const [deletingPk, setDeletingPk] = useState<number | null>(null);
  const [mergeInfo, setMergeInfo] = useState<MergeInfo | null>(null);
  const [merging, setMerging] = useState(false);

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
        onChanged?.();
      })
      .catch((err) => {
        if (err?.response?.status === 409) {
          const conflictData = err.response.data?.name;
          const conflictingPk: number = conflictData?.conflicting_tag_pk;
          const conflictingTag = tags.find((t) => t.pk === conflictingPk);
          const sourceTag = tags.find((t) => t.pk === pk);
          if (sourceTag && conflictingTag) {
            setMergeInfo({
              sourcePk: pk,
              sourceName: sourceTag.name,
              targetPk: conflictingPk,
              targetName: editingName.trim(),
            });
          }
        }
      })
      .finally(() => setSavingPk(null));
  };

  const handleMergeConfirm = () => {
    if (!mergeInfo) return;
    setMerging(true);
    sesyProjectsTagsMergeCreate(projectPk, String(mergeInfo.sourcePk), {
      target_tag_pk: mergeInfo.targetPk,
    })
      .then(() => {
        setTags((prev) => prev.filter((t) => t.pk !== mergeInfo.sourcePk));
        setEditingPk(null);
        setMergeInfo(null);
        onChanged?.();
      })
      .finally(() => setMerging(false));
  };

  const handleDelete = (pk: number) => {
    setDeletingPk(pk);
    sesyProjectsTagsDestroy(projectPk, String(pk))
      .then(() => setTags((prev) => prev.filter((t) => t.pk !== pk)))
      .finally(() => setDeletingPk(null));
  };

  return (
    <>
    <Dialog open={!!mergeInfo} onOpenChange={(o) => !o && setMergeInfo(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Merge Tags</DialogTitle>
          <DialogDescription>
            A tag named <strong>&ldquo;{mergeInfo?.targetName}&rdquo;</strong> already exists. Do
            you want to merge <strong>&ldquo;{mergeInfo?.sourceName}&rdquo;</strong> into{" "}
            <strong>&ldquo;{mergeInfo?.targetName}&rdquo;</strong>? This will move all audience
            members from the old tag to the existing one and delete{" "}
            <strong>&ldquo;{mergeInfo?.sourceName}&rdquo;</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setMergeInfo(null)} disabled={merging}>
            Cancel
          </Button>
          <Button onClick={handleMergeConfirm} disabled={merging}>
            {merging ? "Merging..." : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    </>
  );
};

export default ManageTagsDialog;
