import { useEffect } from "react";
import { FolderIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import { sesyProjectsList } from "@/api/django/projects/projects";
import { useProjectStore } from "@/stores/ProjectStore";

export function ProjectSelector() {
  const { state } = useSidebar();
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

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="px-2 py-1">
      <Select
        value={currentProject?.pk.toString()}
        onValueChange={(value) => {
          const project = projects.find((p) => p.pk.toString() === value);
          if (project) setCurrentProject(project);
        }}
      >
        <SelectTrigger className="w-full h-8 text-sm">
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
    </div>
  );
}
