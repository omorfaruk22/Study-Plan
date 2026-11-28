"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  Layers3,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";
import DataBackupTools from "@/components/manage/DataBackupTools";
import DailyGoalsPanel from "@/components/manage/DailyGoalsPanel";
import ReviewReminderPanel from "@/components/manage/ReviewReminderPanel";
import { formatMinutes, localDateKey } from "@/components/manage/analytics/chart-utils";
import { getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, type DhakaRoutineClock } from "@/lib/routine-time";
import { formatTime12 } from "@/lib/time-format";
import type { OwnerWorkspaceData, RoutineItem, StudyLog, StudyTask } from "@/lib/types";

type OwnerDashboardProps = OwnerWorkspaceData & {
  busy: boolean;
  onRestored: () => Promise<void>;
  onReviewed: (log: StudyLog, today: string, nextReview: string) => Promise<boolean>;
};

type QuickAction = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "green" | "blue" | "amber" | "violet";
};

function isTaskDone(task: StudyTask) {
  return task.status === "সম্পন্ন" || task.status === "জমা হয়েছে";
}

function dateDifference(from: string, to: string) {
  const first = new Date(`${from}T12:00:00`).getTime();
  const second = new Date(`${to}T12:00:00`).getTime();
  return Math.round((second - first) / 86_400_000);
}

function dueLabel(dueDate: string | null | undefined, today: string) {
  if (!dueDate) return "তারিখ সেট করা হয়নি";
  if (!today) return `ডেডলাইন: ${dueDate}`;
  const distance = dateDifference(today, dueDate);
  if (distance < 0) return `${Math.abs(distance)} দিন overdue`;
  if (distance === 0) return "আজ ডেডলাইন";
  if (distance === 1) return "আগামীকাল";
  return `${distance} দিন পরে`;
}

function isInProgress(item: RoutineItem, minutes: number) {
  const start = routineTimeToMinutes(item.start_time);
  const end = routineTimeToMinutes(item.end_time);
  if (start === null || end === null || start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

function routineSort(first: RoutineItem, second: RoutineItem) {
  const firstStart = routineTimeToMinutes(first.start_time);
  const secondStart = routineTimeToMinutes(second.start_time);
  if (firstStart !== null && secondStart !== null) return firstStart - secondStart;
  if (firstStart !== null) return -1;
  if (secondStart !== null) return 1;
  return first.sort_order - second.sort_order;
}

function nextRoutineItem(items: RoutineItem[], minutes: number) {
  return items.find((item) => {
    const start = routineTimeToMinutes(item.start_time);
    return start !== null && start > minutes;
  }) || null;
}

const quickActions: QuickAction[] = [
  {
    href: "/manage/routine",
    icon: CalendarDays,
    title: "রুটিন সাজাও",
    description: "সপ্তাহের পড়া ও ক্লাসের সময় ঠিক করো",
    tone: "green",
  },
  {
    href: "/manage/academic",
    icon: BookOpen,
    title: "বিষয় ও পড়া যোগ করো",
    description: "বিষয় বানাও, সময় ধরে প্রথম session লগ করো",
    tone: "blue",
  },
  {
    href: "/manage/tasks",
    icon: ClipboardList,
    title: "কাজ ট্র্যাক করো",
    description: "Assignment, exam ও deadline চোখে রাখো",
    tone: "amber",
  },
  {
    href: "/manage/analytics",
    icon: BarChart3,
    title: "অগ্রগতি দেখো",
    description: "পড়ার সময় ও ধারাবাহিকতার চিত্র দেখো",
    tone: "violet",
  },
];

export default function OwnerDashboard({ routine, logs, tasks, subjects, busy, onRestored, onReviewed }: OwnerDashboardProps) {
  const [clock, setClock] = useState<DhakaRoutineClock | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(getDhakaRoutineClock(now));
      setToday(localDateKey(now));
    };
    updateClock();
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const todayLogs = useMemo(
    () => logs.filter((log) => Boolean(today) && log.study_date === today),
    [logs, today],
  );
  const todayMinutes = todayLogs.reduce((total, log) => total + Math.max(0, Number(log.actual_minutes) || 0), 0);
  const completedTasks = tasks.filter(isTaskDone);
  const openTasks = tasks.filter((task) => !isTaskDone(task));

  const todayRoutine = useMemo(() => {
    if (!clock) return [];
    return routine
      .filter((item) => routineMatchesDay(item.day, clock.day))
      .sort(routineSort);
  }, [clock, routine]);

  const currentRoutine = clock ? todayRoutine.find((item) => isInProgress(item, clock.minutes)) || null : null;
  const upcomingRoutine = clock && !currentRoutine ? nextRoutineItem(todayRoutine, clock.minutes) : null;
  const agendaItems = useMemo(() => {
    if (!clock) return [];

    const upcomingItems = todayRoutine.filter((item) => {
      const start = routineTimeToMinutes(item.start_time);
      return start !== null && start >= clock.minutes && item.id !== currentRoutine?.id;
    });
    const focusedItems = currentRoutine ? [currentRoutine, ...upcomingItems] : upcomingItems;

    // Once all timed items have passed, retain the end of today's plan instead of
    // jumping back to the early-morning entries on the dashboard.
    return (focusedItems.length ? focusedItems : todayRoutine.slice(-4)).slice(0, 4);
  }, [clock, currentRoutine, todayRoutine]);
  const upcomingTasks = openTasks
    .slice()
    .sort((first, second) => (first.due_date || "9999-12-31").localeCompare(second.due_date || "9999-12-31"))
    .slice(0, 3);

  const isNewWorkspace = subjects.length === 0 && logs.length === 0 && tasks.length === 0;
  const heroTitle = isNewWorkspace
    ? "তোমার পড়ার জায়গাটা আজ থেকেই সাজাও।"
    : "আজকের পড়াটা সুন্দরভাবে এগিয়ে নাও।";
  const heroDescription = isNewWorkspace
    ? "এখানে কোনো চাপ নেই—একটি বিষয়, একটি ছোট রুটিন, আর একটি focus session দিয়েই শুরু করতে পারো।"
    : "রুটিন, লক্ষ্য আর জরুরি কাজগুলো এক জায়গায় আছে—এখন শুধু পরের ছোট ধাপটা বেছে নাও।";

  const stats = [
    {
      icon: Timer,
      label: "আজকের পড়া",
      value: today ? formatMinutes(todayMinutes) : "লোড হচ্ছে…",
      detail: `${todayLogs.length}টি session`,
      tone: "green",
    },
    {
      icon: CalendarDays,
      label: "আজকের রুটিন",
      value: clock ? `${todayRoutine.length}টি` : "—",
      detail: currentRoutine ? "একটি এখন চলছে" : "সময় ধরে সাজানো",
      tone: "blue",
    },
    {
      icon: ListChecks,
      label: "চলমান কাজ",
      value: `${openTasks.length}টি`,
      detail: `${completedTasks.length}/${tasks.length}টি সম্পন্ন`,
      tone: "amber",
    },
    {
      icon: Layers3,
      label: "ট্র্যাক করা বিষয়",
      value: `${subjects.length}টি`,
      detail: subjects.length ? "পড়ার জায়গা প্রস্তুত" : "শুরু করার জন্য যোগ করো",
      tone: "violet",
    },
  ];

  return (
    <div className="owner-dashboard">
      <section className="dashboard-hero" aria-labelledby="dashboard-welcome-title">
        <div className="dashboard-hero-glow" aria-hidden="true" />
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-copy">
            <p className="dashboard-kicker"><Sparkles size={14} /> নিজের স্টাডি স্পেস</p>
            <h1 id="dashboard-welcome-title">{heroTitle}</h1>
            <p className="dashboard-hero-description">{heroDescription}</p>
            <div className="dashboard-hero-actions">
              <Link href="/manage/routine" className="dashboard-primary-action">
                <CalendarDays size={17} /> রুটিন দেখো <ArrowRight size={16} />
              </Link>
              <Link href="/manage/academic" className="dashboard-secondary-action">
                <Plus size={17} /> নতুন পড়া যোগ করো
              </Link>
            </div>
          </div>

          <aside className="dashboard-hero-snapshot" aria-label="আজকের সময় ও পরবর্তী কাজ">
            <div className="dashboard-clock-row">
              <span className="dashboard-clock-icon"><Clock3 size={18} /></span>
              <span>
                <small>ঢাকা সময়</small>
                <strong>{clock?.timeLabel || "--:--"}</strong>
              </span>
            </div>
            <p className="dashboard-clock-date">{clock ? `${clock.day} · ${clock.dateLabel}` : "আজকের পরিকল্পনা লোড হচ্ছে"}</p>
            <div className="dashboard-snapshot-focus">
              <span>{currentRoutine ? "এখন চলছে" : upcomingRoutine ? "পরবর্তী ফোকাস" : "আজকের সংকেত"}</span>
              <strong>{currentRoutine?.title || upcomingRoutine?.title || (todayRoutine.length ? "আজকের রুটিন গুছানো আছে" : "রুটিন যোগ করলে এখানে দেখা যাবে")}</strong>
              {(currentRoutine || upcomingRoutine) && (
                <small>{formatTime12((currentRoutine || upcomingRoutine)!.start_time)} · {(currentRoutine || upcomingRoutine)!.category}</small>
              )}
            </div>
          </aside>
        </div>
        <div className="dashboard-hero-footer">
          <span><CheckCircle2 size={14} /> {isNewWorkspace ? "একদম নিজের মতো করে শুরু করো" : "তোমার পরিকল্পনা তোমার হাতেই"}</span>
          <span>{routine.length}টি রুটিন · {subjects.length}টি বিষয় · {tasks.length}টি কাজ</span>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="আজকের সংক্ষিপ্ত হিসাব">
        {stats.map(({ icon: Icon, label, value, detail, tone }) => (
          <article key={label} className={`dashboard-stat-card dashboard-stat-${tone}`}>
            <span className="dashboard-stat-icon"><Icon size={18} /></span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
          </article>
        ))}
      </section>

      {isNewWorkspace && (
        <section className="dashboard-starter" aria-labelledby="first-steps-title">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">Start simple</p>
              <h2 id="first-steps-title">শুরুটা সহজ রাখো</h2>
              <p>সবকিছু একদিনে বানাতে হবে না। এই তিনটি ছোট ধাপ নিলেই dashboard-টা তোমার জন্য কাজ করতে শুরু করবে।</p>
            </div>
            <span className="dashboard-time-chip"><Target size={14} /> প্রায় ৫ মিনিট</span>
          </div>
          <div className="dashboard-steps">
            <Link href="/manage/academic" className="dashboard-step-card">
              <span className="dashboard-step-number">01</span>
              <GraduationCap size={22} />
              <h3>একটি বিষয় যোগ করো</h3>
              <p>যে বিষয়টা আজ পড়বে, সেটি আগে রাখো।</p>
              <span>বিষয় যোগ করতে যাও <ArrowRight size={14} /></span>
            </Link>
            <Link href="/manage/routine" className="dashboard-step-card">
              <span className="dashboard-step-number">02</span>
              <CalendarDays size={22} />
              <h3>একটি সময় ঠিক করো</h3>
              <p>আজকের জন্য মাত্র একটি ছোট study block দিলেই হবে।</p>
              <span>রুটিন সাজাতে যাও <ArrowRight size={14} /></span>
            </Link>
            <Link href="/manage/academic" className="dashboard-step-card">
              <span className="dashboard-step-number">03</span>
              <Timer size={22} />
              <h3>প্রথম session লগ করো</h3>
              <p>কাজ শেষ হলে সময়টা save করো—অগ্রগতি তৈরি হবে।</p>
              <span>পড়া ট্র্যাক করতে যাও <ArrowRight size={14} /></span>
            </Link>
          </div>
        </section>
      )}

      <section className="dashboard-main-grid" aria-label="আজকের পরিকল্পনা">
        <article className="dashboard-panel dashboard-agenda-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="dashboard-eyebrow">Today&apos;s flow</p>
              <h2>আজকের সময়সূচি</h2>
            </div>
            <Link href="/manage/routine" className="dashboard-panel-link">সব দেখো <ArrowRight size={14} /></Link>
          </div>
          {clock && agendaItems.length > 0 ? (
            <div className="dashboard-agenda-list">
              {agendaItems.map((item) => {
                const active = isInProgress(item, clock.minutes);
                return (
                  <div key={item.id} className={`dashboard-agenda-item${active ? " is-active" : ""}`}>
                    <span className="dashboard-agenda-time">{formatTime12(item.start_time)}</span>
                    <span className="dashboard-agenda-marker" aria-hidden="true" />
                    <span className="dashboard-agenda-content">
                      <strong>{item.title}</strong>
                      <small>{item.category}{item.subject_name ? ` · ${item.subject_name}` : ""}</small>
                    </span>
                    {active && <span className="dashboard-live-pill">এখন</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-panel">
              <span><CalendarDays size={20} /></span>
              <div>
                <strong>{clock ? "আজ কোনো রুটিন রাখা হয়নি" : "সময়সূচি লোড হচ্ছে"}</strong>
                <p>একটি ছোট সময় ঠিক করলেই দিনের flow এখানে দেখা যাবে।</p>
              </div>
              <Link href="/manage/routine"><Plus size={15} /> রুটিন যোগ করো</Link>
            </div>
          )}
        </article>

        <article className="dashboard-panel dashboard-focus-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="dashboard-eyebrow">Next up</p>
              <h2>যা খেয়াল রাখতে হবে</h2>
            </div>
            <Link href="/manage/tasks" className="dashboard-panel-link">কাজগুলো <ArrowRight size={14} /></Link>
          </div>
          {upcomingTasks.length > 0 ? (
            <div className="dashboard-task-list">
              {upcomingTasks.map((task) => (
                <Link href="/manage/tasks" key={task.id} className="dashboard-task-row">
                  <span className={`dashboard-task-priority priority-${task.priority === "জরুরি" ? "urgent" : task.priority === "উচ্চ" ? "high" : "normal"}`} />
                  <span className="dashboard-task-content">
                    <strong>{task.title}</strong>
                    <small>{task.task_type} · {dueLabel(task.due_date, today)}</small>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-clear-state">
              <span><CheckCircle2 size={21} /></span>
              <div>
                <strong>এখন কোনো জরুরি কাজ নেই</strong>
                <p>{todayMinutes > 0 ? `আজ ইতিমধ্যে ${formatMinutes(todayMinutes)} পড়া হয়েছে—ভালো এগোচ্ছো।` : "ছোট একটি কাজ যোগ করলে deadline-টাও চোখে থাকবে।"}</p>
              </div>
              <Link href="/manage/tasks"><Plus size={15} /> কাজ যোগ করো</Link>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-section" aria-labelledby="quick-actions-title">
        <div className="dashboard-section-heading compact">
          <div>
            <p className="dashboard-eyebrow">Quick launch</p>
            <h2 id="quick-actions-title">এখন কী করতে চাও?</h2>
          </div>
          <p>কোনো জটিলতা ছাড়াই প্রয়োজনীয় জায়গায় চলে যাও।</p>
        </div>
        <div className="dashboard-action-grid">
          {quickActions.map(({ href, icon: Icon, title, description, tone }) => (
            <Link key={title} href={href} className={`dashboard-action-card action-${tone}`}>
              <span className="dashboard-action-icon"><Icon size={20} /></span>
              <span className="dashboard-action-copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight size={17} className="dashboard-action-arrow" />
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="daily-focus-title">
        <div className="dashboard-section-heading compact">
          <div>
            <p className="dashboard-eyebrow">Build consistency</p>
            <h2 id="daily-focus-title">দিনের লক্ষ্য ও রিভিশন</h2>
          </div>
          <p>প্রতিদিনের ছোট হিসাবই দীর্ঘমেয়াদি অগ্রগতি তৈরি করে।</p>
        </div>
        <div className="dashboard-widgets">
          <DailyGoalsPanel logs={logs} />
          <ReviewReminderPanel
            logs={logs}
            busy={busy}
            onReviewed={onReviewed}
          />
        </div>
      </section>

      <section className="dashboard-utility" aria-label="তথ্য নিরাপত্তা ও backup">
        <DataBackupTools onRestored={onRestored} />
      </section>
    </div>
  );
}
