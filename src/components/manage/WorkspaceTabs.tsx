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
    <nav aria-label="Management sections" className="mt-7 flex flex-wrap gap-2">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => onChange(id)}
          className={`btn text-sm ${activeTab === id ? "btn-primary" : "btn-plain"}`}
        >
          <Icon size={16} /> {label}
        </button>
      ))}
      <button type="button" onClick={onRefresh} className="btn btn-plain ml-auto text-sm">
        <RefreshCw size={15} /> Refresh
      </button>
    </nav>
  );
}
