"use client";

import { usePathname } from "next/navigation";
import ManageWorkspace from "@/components/manage/ManageWorkspace";
import type { PlannerProfile } from "@/components/manage/PlannerLayout";
import type { WorkspaceTab } from "@/components/manage/WorkspaceTabs";

const sections: Record<string, WorkspaceTab> = {
  "/manage": "dashboard",
  "/manage/calendar": "calendar",
  "/manage/routine": "routine",
  "/manage/academic": "academic",
  "/manage/duet": "duet",
  "/manage/tasks": "tasks",
  "/manage/progress": "progress",
  "/manage/analytics": "analytics",
  "/manage/settings": "settings",
};

export default function ManageWorkspaceRouter({ profile }: { profile: PlannerProfile }) {
  const pathname = usePathname();
  const activeTab = sections[pathname];
  if (!activeTab) return null;
  return <ManageWorkspace activeTab={activeTab} profile={profile} />;
}
