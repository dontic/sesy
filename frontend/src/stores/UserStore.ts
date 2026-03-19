import { create } from "zustand";

import type { User } from "@/api/django/djangoAPI.schemas";

interface UserStore {
  user: (User & { full_name?: string }) | undefined;
  setUser: (user: User & { full_name?: string }) => void;
  updateAvatar: (avatar: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: undefined,
  setUser: (user) =>
    set({
      user: {
        ...user,
        full_name:
          [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
          undefined
      }
    }),
  updateAvatar: (avatar) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          profile: {
            ...(currentUser as any).profile,
            avatar
          }
        }
      });
    }
  },
  clearUser: () => set({ user: undefined })
}));
