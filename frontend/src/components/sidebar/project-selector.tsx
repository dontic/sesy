import { useEffect, useState } from "react";
import {
  FolderIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  ChevronsUpDownIcon,
  CheckIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useSidebar } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  sesyProjectsList,
  sesyProjectsCreate,
  sesyProjectsUpdate,
  sesyProjectsDestroy
} from "@/api/django/projects/projects";
import { useProjectStore } from "@/stores/ProjectStore";
import type { Project } from "@/api/django/djangoAPI.schemas";
import { cn } from "@/lib/utils";

/* ----------------------------------- Zod ---------------------------------- */
const ProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional()
});

type ProjectValues = z.infer<typeof ProjectSchema>;

/* ----------------------------- New Project Dialog ------------------------- */
function NewProjectDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { projects, setCurrentProject } = useProjectStore();
  const setProjects = useProjectStore((s) => s.setProjects);

  const form = useForm<ProjectValues>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: { name: "", description: "" }
  });

  async function onSubmit(values: ProjectValues) {
    const created = await sesyProjectsCreate({
      name: values.name,
      description: values.description || undefined
    });
    const updated = [...projects, created];
    setProjects(updated);
    setCurrentProject(created);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Edit Project Dialog ------------------------ */
function EditProjectDialog({
  project,
  open,
  onOpenChange
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { projects, setProjects, currentProject, setCurrentProject } =
    useProjectStore();

  const form = useForm<ProjectValues>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: { name: project.name, description: project.description ?? "" }
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: project.name, description: project.description ?? "" });
    }
  }, [open, project, form]);

  async function onSubmit(values: ProjectValues) {
    const updated = await sesyProjectsUpdate(project.pk.toString(), {
      name: values.name,
      description: values.description || undefined
    });
    const updatedList = projects.map((p) => (p.pk === updated.pk ? updated : p));
    setProjects(updatedList);
    if (currentProject?.pk === updated.pk) {
      setCurrentProject(updated);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- Delete Confirmation -------------------------- */
function DeleteProjectDialog({
  project,
  open,
  onOpenChange
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { projects, setProjects } = useProjectStore();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await sesyProjectsDestroy(project.pk.toString());
      setProjects(projects.filter((p) => p.pk !== project.pk));
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The project and all its data will be
            permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------------------- Project Selector ---------------------------- */
export function ProjectSelector() {
  const { state } = useSidebar();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const { projects, currentProject, setProjects, setCurrentProject } =
    useProjectStore();

  useEffect(() => {
    sesyProjectsList().then((data) => {
      setProjects(data);
    });
  }, [setProjects]);

  if (state === "collapsed") {
    return (
      <div className="flex items-center justify-center py-2">
        <FolderIcon className="h-4 w-4 text-sidebar-foreground/70" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1 px-2 py-1">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="h-8 flex-1 min-w-0 justify-between text-sm font-normal px-3"
            >
              <span className="truncate">
                {currentProject ? (
                  <>
                    <span className="text-muted-foreground text-xs mr-1">
                      #{currentProject.pk}
                    </span>
                    {currentProject.name}
                  </>
                ) : (
                  "Select project"
                )}
              </span>
              <ChevronsUpDownIcon className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-1" align="start">
            <div className="flex flex-col gap-0.5">
              {projects.map((project) => (
                <div
                  key={project.pk}
                  className={cn(
                    "flex items-center gap-1 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent group",
                    currentProject?.pk === project.pk && "bg-accent"
                  )}
                  onClick={() => {
                    setCurrentProject(project);
                    setPopoverOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      currentProject?.pk === project.pk
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="flex-1 min-w-0 text-sm truncate">
                    <span className="text-muted-foreground text-xs mr-1">
                      #{project.pk}
                    </span>
                    {project.name}
                  </span>
                  <button
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopoverOpen(false);
                      setEditProject(project);
                    }}
                    title="Edit project"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </button>
                  <button
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopoverOpen(false);
                      setDeleteProject(project);
                    }}
                    title="Delete project"
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground px-2 py-1.5">
                  No projects yet.
                </p>
              )}
            </div>
            <div className="mt-1 pt-1 border-t">
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => {
                  setPopoverOpen(false);
                  setNewDialogOpen(true);
                }}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                New project
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <NewProjectDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />
      {editProject && (
        <EditProjectDialog
          project={editProject}
          open={!!editProject}
          onOpenChange={(open) => { if (!open) setEditProject(null); }}
        />
      )}
      {deleteProject && (
        <DeleteProjectDialog
          project={deleteProject}
          open={!!deleteProject}
          onOpenChange={(open) => { if (!open) setDeleteProject(null); }}
        />
      )}
    </>
  );
}
