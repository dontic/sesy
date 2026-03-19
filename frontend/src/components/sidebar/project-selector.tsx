import { useEffect, useState } from "react";
import { FolderIcon, PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  sesyProjectsList,
  sesyProjectsCreate
} from "@/api/django/projects/projects";
import { useProjectStore } from "@/stores/ProjectStore";

/* ----------------------------------- Zod ---------------------------------- */
const NewProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional()
});

type NewProjectValues = z.infer<typeof NewProjectSchema>;

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

  const form = useForm<NewProjectValues>({
    resolver: zodResolver(NewProjectSchema),
    defaultValues: { name: "", description: "" }
  });

  async function onSubmit(values: NewProjectValues) {
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

/* ---------------------------- Project Selector ---------------------------- */
export function ProjectSelector() {
  const { state } = useSidebar();
  const [dialogOpen, setDialogOpen] = useState(false);
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
        <Select
          value={currentProject?.pk.toString()}
          onValueChange={(value) => {
            const project = projects.find((p) => p.pk.toString() === value);
            if (project) setCurrentProject(project);
          }}
        >
          <SelectTrigger className="h-8 text-sm flex-1 min-w-0">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.pk} value={project.pk.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setDialogOpen(true)}
          title="New project"
        >
          <PlusIcon className="h-4 w-4 hover:cursor-pointer hover:text-primary" />
        </Button>
      </div>
      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
