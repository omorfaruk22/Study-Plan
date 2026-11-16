"use client";

import { usePathname } from "next/navigation";
import ManageWorkspace from "@/components/manage/ManageWorkspace";
import type { WorkspaceTab } from "@/components/manage/WorkspaceTabs";

const sections: Record<string, WorkspaceTab> = {
  "/manage": "routine",
  "/manage/academic": "academic",
  "/manage/duet": "duet",
  "/manage/tasks": "tasks",
  "/manage/analytics": "analytics",
};

export default function ManageWorkspaceRouter() {
  const pathname = usePathname();
  const activeTab = sections[pathname];
  if (!activeTab) return null;
  return <ManageWorkspace activeTab={activeTab} />;
}
