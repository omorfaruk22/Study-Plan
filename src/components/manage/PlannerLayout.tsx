"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/actions";
import { getDhakaDateKey } from "@/lib/routine-time";
import type { OwnerWorkspaceData } from "@/lib/types";
import type { WorkspaceTab } from "@/components/manage/WorkspaceTabs";

export type PlannerProfile = {
  name: string | null;
  email: string;
  image: string | null;
};

type PlannerLayoutProps = {
  activeTab: WorkspaceTab;
  profile: PlannerProfile;
  workspace: OwnerWorkspaceData;
  selectedDate: string;
  onSelectedDateChange: (value: string) => void;
  onRefresh: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  children: ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  tab: WorkspaceTab;
  icon: LucideIcon;
};

type SearchResult = {
  label: string;
  detail: string;
  href: string;
  icon: LucideIcon;
};

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/manage", tab: "dashboard", icon: LayoutDashboard },
  { label: "My Plan", href: "/manage/tasks", tab: "tasks", icon: CalendarDays },
  { label: "Subjects", href: "/manage/academic", tab: "academic", icon: BookOpen },
  { label: "DUET Prep", href: "/manage/duet", tab: "duet", icon: GraduationCap },
  { label: "Progress", href: "/manage/progress", tab: "progress", icon: Target },
  { label: "Calendar", href: "/manage/calendar", tab: "calendar", icon: CalendarDays },
  { label: "Notes", href: "/manage/academic", tab: "academic", icon: NotebookPen },
  { label: "Settings", href: "/manage/settings", tab: "settings", icon: Settings },
];

function isTaskDone(status: string) {
  return status === "সম্পন্ন" || status === "জমা হয়েছে";
}

function dateDifference(from: string, to: string) {
  const first = new Date(`${from}T12:00:00Z`).getTime();
  const second = new Date(`${to}T12:00:00Z`).getTime();
  return Math.round((second - first) / 86_400_000);
}

function displayDate(value: string) {
  if (!value) return "তারিখ বেছে নাও";
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

function profileInitials(source: string) {
  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "OF";
}

function SidebarProfile({ profile, collapsed }: { profile: PlannerProfile; collapsed: boolean }) {
  const displayName = "Omor Faruk";
  return (
    <div className="planner-profile">
      <span className="planner-avatar" aria-label={displayName}>
        <span className="planner-avatar-fallback">{profileInitials(displayName)}</span>
        {profile.image && <img src={profile.image} alt="" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.remove(); }} />}
        <i aria-hidden="true" />
      </span>
      {!collapsed && (
        <div className="planner-profile-copy">
          <strong>{displayName}</strong>
          <span>Dream Big…</span>
        </div>
      )}
    </div>
  );
}

function SidebarNavigation({ activeTab, collapsed, onNavigate }: { activeTab: WorkspaceTab; collapsed: boolean; onNavigate: () => void }) {
  return (
    <nav className="planner-side-nav" aria-label="Study planner navigation">
      {navigation.map(({ label, href, tab, icon: Icon }) => {
        const active = activeTab === tab && label !== "Notes";
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={`planner-side-link${active ? " is-active" : ""}`}
          >
            <Icon size={19} />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function PlannerSearch({ workspace, onNavigate }: { workspace: OwnerWorkspaceData; onNavigate: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const normalized = query.trim().toLocaleLowerCase();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const results = useMemo(() => {
    if (!normalized) return [] as SearchResult[];
    const output: SearchResult[] = [];
    const matches = (value: string | null | undefined) => value?.toLocaleLowerCase().includes(normalized);

    for (const subject of workspace.subjects) {
      if (matches(subject.name) || matches(subject.code)) output.push({ label: subject.name, detail: subject.category, href: "/manage/academic", icon: BookOpen });
    }
    for (const task of workspace.tasks) {
      if (matches(task.title) || matches(task.subject_name)) output.push({ label: task.title, detail: task.task_type, href: "/manage/tasks", icon: ClipboardList });
    }
    for (const routine of workspace.routine) {
      if (matches(routine.title) || matches(routine.subject_name)) output.push({ label: routine.title, detail: `${routine.day} · ${routine.start_time}`, href: "/manage/routine", icon: CalendarDays });
    }
    for (const log of workspace.logs) {
      if (matches(log.topic) || matches(log.subject_name)) output.push({ label: log.topic, detail: `${log.study_date} · study log`, href: "/manage/academic", icon: NotebookPen });
    }

    return output.slice(0, 7);
  }, [normalized, workspace]);

  return (
    <div className="planner-search">
      <Search size={20} aria-hidden="true" />
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        placeholder="Search your study data..."
        aria-label="Search subjects, plans, tasks, and study logs"
      />
      {query && <button type="button" onClick={() => { setQuery(""); setOpen(false); }} aria-label="Clear search"><X size={15} /></button>}
      {open && normalized && (
        <div className="planner-search-menu" role="listbox">
          {results.length > 0 ? results.map(({ label, detail, href, icon: Icon }, index) => (
            <Link key={`${label}-${index}`} href={href} role="option" onClick={() => { setOpen(false); onNavigate(); }} className="planner-search-result">
              <span><Icon size={16} /></span>
              <span><strong>{label}</strong><small>{detail}</small></span>
              <ChevronRight size={15} />
            </Link>
          )) : (
            <p className="planner-search-empty">তোমার live data-তে কোনো ফল পাওয়া যায়নি।</p>
          )}
        </div>
      )}
    </div>
  );
}

function PlannerNotifications({ workspace }: { workspace: OwnerWorkspaceData }) {
  const [open, setOpen] = useState(false);
  const today = getDhakaDateKey();
  const notifications = useMemo(() => {
    const rows: { title: string; detail: string; tone: "review" | "task" }[] = [];
    for (const log of workspace.logs) {
      if (log.review_due_date && dateDifference(today, log.review_due_date) >= 0) {
        rows.push({ title: log.topic, detail: "Review করার সময় হয়েছে", tone: "review" });
      }
    }
    for (const task of workspace.tasks) {
      if (!isTaskDone(task.status) && task.due_date) {
        const daysUntilDue = dateDifference(today, task.due_date);
        if (daysUntilDue <= 1) {
          const detail = daysUntilDue < 0
            ? `${Math.abs(daysUntilDue)} দিন overdue`
            : daysUntilDue === 0 ? "আজ deadline" : "আগামীকাল deadline";
          rows.push({ title: task.title, detail, tone: "task" });
        }
      }
    }
    return rows.slice(0, 6);
  }, [today, workspace]);

  return (
    <div className="planner-notifications">
      <button type="button" aria-label="Notifications" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="planner-icon-button">
        <Bell size={21} />
        {notifications.length > 0 && <span>{notifications.length > 9 ? "9+" : notifications.length}</span>}
      </button>
      {open && (
        <section className="planner-notification-menu" aria-label="Study reminders">
          <header><strong>Notifications</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><X size={15} /></button></header>
          {notifications.length > 0 ? notifications.map((item, index) => (
            <article key={`${item.title}-${index}`} className={`planner-notification ${item.tone}`}>
              <span>{item.tone === "review" ? <NotebookPen size={15} /> : <CalendarDays size={15} />}</span>
              <div><strong>{item.title}</strong><small>{item.detail}</small></div>
            </article>
          )) : <p className="planner-notification-empty">এখন কোনো নতুন reminder নেই।</p>}
        </section>
      )}
    </div>
  );
}

export default function PlannerLayout({ activeTab, profile, workspace, selectedDate, onSelectedDateChange, onRefresh, darkMode, onToggleDarkMode, children }: PlannerLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, startLogout] = useTransition();

  useEffect(() => {
    const updateViewportNavigation = () => {
      if (window.innerWidth <= 700) {
        setCollapsed(false);
      } else {
        setMobileOpen(false);
      }
    };
    updateViewportNavigation();
    window.addEventListener("resize", updateViewportNavigation);
    return () => window.removeEventListener("resize", updateViewportNavigation);
  }, []);

  const closeMobileNav = () => setMobileOpen(false);

  return (
    <div className={`planner-shell${darkMode ? " is-theme-dark" : " is-theme-light"}${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}>
      <div className="planner-mobile-backdrop" onClick={closeMobileNav} aria-hidden="true" />
      <aside id="planner-navigation" className="planner-sidebar">
        <div className="planner-sidebar-top">
          <SidebarProfile profile={profile} collapsed={collapsed} />
          <button type="button" className="planner-sidebar-collapse" onClick={() => setCollapsed((current) => !current)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button type="button" className="planner-mobile-close" onClick={closeMobileNav} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <SidebarNavigation activeTab={activeTab} collapsed={collapsed} onNavigate={closeMobileNav} />
        {!collapsed && (
          <section className="planner-motivation-card">
            <span><Trophy size={23} /></span>
            <strong>You&apos;re doing great!</strong>
            <p>Keep going towards your goals.</p>
            <Link href="/manage/progress" onClick={closeMobileNav}>Achieve More <ChevronRight size={15} /></Link>
          </section>
        )}
        <div className="planner-sidebar-bottom">
          <button
            type="button"
            className="planner-theme-toggle"
            onClick={onToggleDarkMode}
            aria-pressed={darkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={collapsed ? darkMode ? "Switch to light mode" : "Switch to dark mode" : undefined}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
            <i aria-hidden="true"><b /></i>
          </button>
          <button type="button" className="planner-logout" disabled={loggingOut} onClick={() => startLogout(() => { void logoutAction(); })} title={collapsed ? "Logout" : undefined}>
            <LogOut size={18} /> {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
          </button>
        </div>
      </aside>

      <main className="planner-main">
        <header className="planner-topbar">
          <button type="button" className="planner-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-controls="planner-navigation" aria-expanded={mobileOpen}><Menu size={22} /></button>
          <PlannerSearch workspace={workspace} onNavigate={closeMobileNav} />
          <div className="planner-topbar-actions">
            <button type="button" onClick={onRefresh} className="planner-refresh-button" aria-label="Refresh live data" title="Refresh live data"><RefreshCw size={17} /></button>
            <PlannerNotifications workspace={workspace} />
            <label className="planner-date-picker" title="Dashboard date">
              <CalendarDays size={17} />
              <span>{displayDate(selectedDate)}</span>
              <input type="date" value={selectedDate} onChange={(event) => onSelectedDateChange(event.target.value)} aria-label="Dashboard date" />
            </label>
          </div>
        </header>
        <div className="planner-content">{children}</div>
      </main>
    </div>
  );
}
