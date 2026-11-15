import { BookOpen, CalendarDays, ClipboardList, RefreshCw, type LucideIcon } from "lucide-react";

export type WorkspaceTab = "routine" | "logs" | "tasks" | "subjects";

type WorkspaceTabsProps = {
  activeTab: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
  onRefresh: () => void;
};

const tabs: { id: WorkspaceTab; label: string; icon: LucideIcon }[] = [
  { id: "routine", label: "সাপ্তাহিক রুটিন", icon: CalendarDays },
  { id: "logs", label: "দৈনিক পড়ার লগ", icon: BookOpen },
  { id: "tasks", label: "Assignment ও পরীক্ষা", icon: ClipboardList },
  { id: "subjects", label: "বিষয় তালিকা", icon: BookOpen },
];

export default function WorkspaceTabs({ activeTab, onChange, onRefresh }: WorkspaceTabsProps) {
  return (
    <nav aria-label="Management sections" className="mt-6 grid grid-cols-2 gap-2 sm:mt-7 sm:flex sm:flex-wrap">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => onChange(id)}
          className={`btn w-full justify-start px-2.5 py-2 text-left text-xs leading-4 sm:w-auto sm:justify-center sm:px-4 sm:py-[11px] sm:text-sm ${activeTab === id ? "btn-primary" : "btn-plain"}`}
        >
          <Icon size={16} /> {label}
        </button>
      ))}
      <button type="button" onClick={onRefresh} className="btn btn-plain col-span-2 justify-center text-sm sm:ml-auto">
        <RefreshCw size={15} /> Refresh
      </button>
    </nav>
  );
}
