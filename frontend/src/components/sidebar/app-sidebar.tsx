import * as React from "react";
import { RocketIcon, UsersIcon } from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { NavHeader } from "@/components/sidebar/nav-header";
import { ProjectSelector } from "@/components/sidebar/project-selector";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar";

// This is sample data.
export const navData = [
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: RocketIcon
  },
  {
    title: "Audience",
    url: "/audience",
    icon: UsersIcon
  }
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavHeader />
        <ProjectSelector />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
