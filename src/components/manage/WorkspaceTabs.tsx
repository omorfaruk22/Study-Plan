import Link from "next/link";
import { type MouseEvent, useEffect, useRef } from "react";
import { BarChart3, BookOpen, CalendarDays, ClipboardList, RefreshCw, type LucideIcon } from "lucide-react";

export type WorkspaceTab = "routine" | "academic" | "duet" | "tasks" | "analytics";

type WorkspaceTabsProps = {
  activeTab: WorkspaceTab;
  onRefresh: () => void;
};

const tabs: { id: WorkspaceTab; href: string; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { id: "routine", href: "/manage", label: "সাপ্তাহিক রুটিন", shortLabel: "রুটিন", icon: CalendarDays },
  { id: "academic", href: "/manage/academic", label: "Academic", shortLabel: "Academic", icon: BookOpen },
  { id: "duet", href: "/manage/duet", label: "DUET", shortLabel: "DUET", icon: BookOpen },
  { id: "tasks", href: "/manage/tasks", label: "Assignment ও পরীক্ষা", shortLabel: "কাজ", icon: ClipboardList },
  { id: "analytics", href: "/manage/analytics", label: "পরিসংখ্যান", shortLabel: "Stats", icon: BarChart3 },
];

function switchSection(event: MouseEvent<HTMLAnchorElement>, href: string) {
  if (
    event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
    event.shiftKey || event.altKey
  ) return;

  event.preventDefault();
  if (window.location.pathname !== href) {
    // These views share one manager layout, so avoid a server round trip per tab.
    window.history.pushState(null, "", href);
  }
}

export default function WorkspaceTabs({ activeTab, onRefresh }: WorkspaceTabsProps) {
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      activeTabRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  return (
    <nav aria-label="Management sections" className="mobile-tab-scroll flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {tabs.map(({ id, href, label, shortLabel, icon: Icon }) => (
        <Link
          key={id}
          ref={activeTab === id ? activeTabRef : undefined}
          href={href}
          onClick={(event) => switchSection(event, href)}
          aria-current={activeTab === id ? "page" : undefined}
          aria-label={label}
          title={label}
          className={`btn min-h-10 shrink-0 justify-center gap-1.5 px-3 py-2 text-xs leading-4 sm:min-h-11 sm:px-4 sm:py-[11px] sm:text-sm ${activeTab === id ? "btn-primary" : "btn-plain"}`}
        >
          <Icon size={16} /> <span className="sm:hidden">{shortLabel}</span><span className="hidden sm:inline">{label}</span>
        </Link>
      ))}
      <button type="button" onClick={onRefresh} aria-label="তথ্য refresh" className="btn btn-plain min-h-10 shrink-0 px-3 py-2 text-xs sm:ml-auto sm:min-h-11 sm:text-sm">
        <RefreshCw size={15} /> <span className="sm:hidden">Refresh</span><span className="hidden sm:inline">Refresh</span>
      </button>
    </nav>
  );
}
