import { create } from "zustand";

import type { Project } from "@/api/django/djangoAPI.schemas";

interface ProjectStore {
  projects: Project[];
  currentProject: Project | undefined;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: undefined,
  setProjects: (projects) =>
    set((state) => ({
      projects,
      currentProject:
        state.currentProject !== undefined
          ? projects.find((p) => p.pk === state.currentProject!.pk) ?? (projects.length > 0 ? projects[0] : undefined)
          : projects.length > 0
          ? projects[0]
          : undefined,
    })),
  setCurrentProject: (project) => set({ currentProject: project }),
  clearProjects: () => set({ projects: [], currentProject: undefined }),
}));
