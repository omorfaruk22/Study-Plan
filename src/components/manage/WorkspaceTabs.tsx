import Link from "next/link";
import { BarChart3, BookOpen, CalendarDays, ClipboardList, RefreshCw, type LucideIcon } from "lucide-react";

export type WorkspaceTab = "routine" | "academic" | "duet" | "tasks" | "analytics";

type WorkspaceTabsProps = {
  activeTab: WorkspaceTab;
  onRefresh: () => void;
};

const tabs: { id: WorkspaceTab; href: string; label: string; icon: LucideIcon }[] = [
  { id: "routine", href: "/manage", label: "সাপ্তাহিক রুটিন", icon: CalendarDays },
  { id: "academic", href: "/manage/academic", label: "Academic", icon: BookOpen },
  { id: "duet", href: "/manage/duet", label: "DUET", icon: BookOpen },
  { id: "tasks", href: "/manage/tasks", label: "Assignment ও পরীক্ষা", icon: ClipboardList },
  { id: "analytics", href: "/manage/analytics", label: "পরিসংখ্যান", icon: BarChart3 },
];

export default function WorkspaceTabs({ activeTab, onRefresh }: WorkspaceTabsProps) {
  return (
    <nav aria-label="Management sections" className="mt-6 grid grid-cols-2 gap-2 sm:mt-7 sm:flex sm:flex-wrap">
      {tabs.map(({ id, href, label, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={activeTab === id ? "page" : undefined}
          className={`btn w-full justify-start px-2.5 py-2 text-left text-xs leading-4 sm:w-auto sm:justify-center sm:px-4 sm:py-[11px] sm:text-sm ${activeTab === id ? "btn-primary" : "btn-plain"}`}
        >
          <Icon size={16} /> {label}
        </Link>
      ))}
      <button type="button" onClick={onRefresh} className="btn btn-plain col-span-2 justify-center text-sm sm:ml-auto">
        <RefreshCw size={15} /> Refresh
      </button>
    </nav>
  );
}
