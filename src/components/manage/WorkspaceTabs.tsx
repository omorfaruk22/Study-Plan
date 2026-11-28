import Link from "next/link";
import { type MouseEvent, useEffect, useRef } from "react";
import { BarChart3, BookOpen, CalendarDays, ClipboardList, LayoutDashboard, NotebookPen, RefreshCw, Settings, type LucideIcon } from "lucide-react";

export type WorkspaceTab = "dashboard" | "calendar" | "routine" | "academic" | "duet" | "tasks" | "notes" | "analytics" | "progress" | "settings";

type WorkspaceTabsProps = {
  activeTab: WorkspaceTab;
  onRefresh: () => void;
};

const tabs: { id: WorkspaceTab; href: string; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", href: "/manage", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "calendar", href: "/manage/calendar", label: "Calendar", icon: CalendarDays },
  { id: "routine", href: "/manage/routine", label: "রুটিন", icon: CalendarDays },
  { id: "academic", href: "/manage/academic", label: "Academic", icon: BookOpen },
  { id: "duet", href: "/manage/duet", label: "DUET", icon: BookOpen },
  { id: "tasks", href: "/manage/tasks", label: "কাজ", icon: ClipboardList },
  { id: "notes", href: "/manage/notes", label: "Notes", icon: NotebookPen },
  { id: "progress", href: "/manage/progress", label: "Progress", icon: BarChart3 },
  { id: "analytics", href: "/manage/analytics", label: "পরিসংখ্যান", icon: BarChart3 },
  { id: "settings", href: "/manage/settings", label: "Settings", icon: Settings },
];

function switchSection(event: MouseEvent<HTMLAnchorElement>, href: string) {
  if (
    event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
    event.shiftKey || event.altKey
  ) return;

  event.preventDefault();
  if (window.location.pathname !== href) {
    // The workspace is already hydrated, so move between sections without a second server round trip.
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
    <nav aria-label="স্টাডি ম্যানেজমেন্টের বিভাগ" className="workspace-tabs mobile-tab-scroll">
      <div className="workspace-tabs-list">
        {tabs.map(({ id, href, label, icon: Icon }) => (
          <Link
            key={id}
            ref={activeTab === id ? activeTabRef : undefined}
            href={href}
            onClick={(event) => switchSection(event, href)}
            aria-current={activeTab === id ? "page" : undefined}
            className={`workspace-tab${activeTab === id ? " is-active" : ""}`}
          >
            <Icon size={16} /> <span>{label}</span>
          </Link>
        ))}
      </div>
      <button type="button" onClick={onRefresh} aria-label="তথ্য নতুন করে লোড করো" className="workspace-refresh">
        <RefreshCw size={15} /> <span>Refresh</span>
      </button>
    </nav>
  );
}
