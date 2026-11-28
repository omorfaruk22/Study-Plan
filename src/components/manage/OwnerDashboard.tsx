"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Clock3,
  Flame,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import DataBackupTools from "@/components/manage/DataBackupTools";
import DailyGoalsPanel from "@/components/manage/DailyGoalsPanel";
import ReviewReminderPanel from "@/components/manage/ReviewReminderPanel";
import { formatMinutes, subjectLabel } from "@/components/manage/analytics/chart-utils";
import { formatTimeRange, getDhakaDateKey, getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, type DhakaRoutineClock } from "@/lib/routine-time";
import type { OwnerWorkspaceData, RoutineItem, StudyLog, StudyTask } from "@/lib/types";

type OwnerDashboardProps = OwnerWorkspaceData & {
  selectedDate: string;
  busy: boolean;
  onRestored: () => Promise<void>;
  onReviewed: (log: StudyLog, today: string, nextReview: string) => Promise<boolean>;
  onCompleteTask: (task: StudyTask) => Promise<boolean>;
};

type StatCard = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "subjects" | "time" | "progress" | "streak";
};

type UpcomingItem = RoutineItem & { dateKey: string; dayOffset: number };

function isTaskDone(task: StudyTask) {
  return task.status === "সম্পন্ন" || task.status === "জমা হয়েছে";
}

function addDaysToDateKey(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function dayStreak(logs: StudyLog[], today: string) {
  if (!today) return 0;
  const studiedDays = new Set(logs.filter((log) => Number(log.actual_minutes) > 0).map((log) => log.study_date));
  let streak = 0;
  let cursor = today;
  while (studiedDays.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }
  return streak;
}

function greeting(minutes: number) {
  if (minutes < 12 * 60) return "Good Morning!";
  if (minutes < 17 * 60) return "Good Afternoon!";
  return "Good Evening!";
}

function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(dateFromKey(value));
}

function taskProgress(tasks: StudyTask[]) {
  if (!tasks.length) return null;
  return Math.round(tasks.filter(isTaskDone).length / tasks.length * 100);
}

function buildStudySeries(logs: StudyLog[], today: string, days: number) {
  if (!today) return [];
  const totals = new Map<string, number>();
  for (const log of logs) {
    totals.set(log.study_date, (totals.get(log.study_date) || 0) + Math.max(0, Number(log.actual_minutes) || 0));
  }
  return Array.from({ length: days }, (_, index) => {
    const date = addDaysToDateKey(today, index - (days - 1));
    return { date, minutes: totals.get(date) || 0 };
  });
}

function getUpcomingRoutine(routine: RoutineItem[], clock: DhakaRoutineClock | null, today: string) {
  if (!clock || !today) return [] as UpcomingItem[];
  const occurrences: UpcomingItem[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const dateKey = addDaysToDateKey(today, offset);
    const day = getDhakaRoutineClock(new Date(`${dateKey}T06:00:00Z`)).day;
    for (const item of routine) {
      const start = routineTimeToMinutes(item.start_time);
      if (!routineMatchesDay(item.day, day)) continue;
      if (offset === 0 && start !== null && start <= clock.minutes) continue;
      occurrences.push({ ...item, dateKey, dayOffset: offset });
    }
  }
  return occurrences
    .sort((first, second) => {
      if (first.dayOffset !== second.dayOffset) return first.dayOffset - second.dayOffset;
      const firstStart = routineTimeToMinutes(first.start_time);
      const secondStart = routineTimeToMinutes(second.start_time);
      if (firstStart !== null && secondStart !== null) return firstStart - secondStart;
      if (firstStart !== null) return -1;
      if (secondStart !== null) return 1;
      return first.sort_order - second.sort_order;
    })
    .slice(0, 4);
}

function ProgressRing({ progress }: { progress: number | null }) {
  const circumference = 2 * Math.PI * 56;
  const offset = progress === null ? circumference : circumference - (circumference * progress / 100);
  return (
    <div className="planner-progress-ring" style={{ "--ring-offset": offset } as CSSProperties}>
      <svg viewBox="0 0 140 140" role="img" aria-label={progress === null ? "No task progress data" : `${progress}% task progress`}>
        <defs>
          <linearGradient id="planner-progress-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#00ff73" />
            <stop offset="100%" stopColor="#a3ff42" />
          </linearGradient>
          <filter id="planner-progress-glow"><feGaussianBlur stdDeviation="2.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx="70" cy="70" r="56" className="planner-progress-track" />
        {progress !== null && <circle cx="70" cy="70" r="56" className="planner-progress-value" strokeDasharray={circumference} filter="url(#planner-progress-glow)" />}
      </svg>
      <div>
        <strong>{progress === null ? "—" : `${progress}%`}</strong>
        <span>{progress === null ? "No task data" : "Completed"}</span>
      </div>
    </div>
  );
}

function StudyHistoryChart({ series }: { series: { date: string; minutes: number }[] }) {
  const hasData = series.some((item) => item.minutes > 0);
  if (!hasData) {
    return <div className="planner-chart-empty"><BarChart3 size={23} /><strong>এখনো কোনো study history নেই</strong><span>পড়ার session save হলে এখানে live progress chart দেখা যাবে।</span></div>;
  }

  const width = 650;
  const height = 210;
  const padding = { top: 18, right: 14, bottom: 34, left: 34 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...series.map((item) => item.minutes), 1);
  const points = series.map((item, index) => {
    const x = padding.left + chartWidth * index / Math.max(1, series.length - 1);
    const y = padding.top + chartHeight - (item.minutes / max * chartHeight);
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M ${points[0].x},${padding.top + chartHeight} L ${points.map((point) => `${point.x},${point.y}`).join(" L ")} L ${points[points.length - 1].x},${padding.top + chartHeight} Z`;
  const labels = Array.from(new Set(
    Array.from({ length: Math.min(5, points.length) }, (_, index) => Math.round(index * (points.length - 1) / Math.max(1, Math.min(5, points.length) - 1))),
  )).map((index) => points[index]);

  return (
    <div className="planner-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="planner-history-chart" role="img" aria-label={`Actual study time over the last ${series.length} days`}>
        <defs>
          <linearGradient id="planner-area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00e676" stopOpacity=".4" />
            <stop offset="100%" stopColor="#00e676" stopOpacity="0" />
          </linearGradient>
          <filter id="planner-line-glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((level) => {
          const y = padding.top + chartHeight - chartHeight * level;
          return <line key={level} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="planner-chart-grid" />;
        })}
        <path d={area} fill="url(#planner-area-gradient)" />
        <polyline points={line} className="planner-chart-line" filter="url(#planner-line-glow)" />
        {points.map((point) => (
          <g key={point.date}>
            <title>{`${dateLabel(point.date)}: ${formatMinutes(point.minutes)}`}</title>
            {point.minutes > 0 && <circle cx={point.x} cy={point.y} r="4.1" className="planner-chart-point" />}
          </g>
        ))}
        {labels.map((point) => <text key={point.date} x={point.x} y={height - 10} textAnchor="middle" className="planner-chart-label">{dateLabel(point.date)}</text>)}
      </svg>
    </div>
  );
}

export default function OwnerDashboard({ routine, logs, tasks, subjects, selectedDate, busy, onRestored, onReviewed, onCompleteTask }: OwnerDashboardProps) {
  const [clock, setClock] = useState<DhakaRoutineClock | null>(null);
  const [today, setToday] = useState("");
  const [chartDays, setChartDays] = useState<7 | 30>(30);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(getDhakaRoutineClock(now));
      setToday(getDhakaDateKey(now));
    };
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const completedTaskCount = tasks.filter(isTaskDone).length;
  const progress = taskProgress(tasks);
  const studyToday = logs
    .filter((log) => Boolean(today) && log.study_date === today)
    .reduce((total, log) => total + Math.max(0, Number(log.actual_minutes) || 0), 0);
  const streak = dayStreak(logs, today);
  const studySeries = useMemo(() => buildStudySeries(logs, today, chartDays), [chartDays, logs, today]);
  const planTasks = tasks.filter((task) => task.due_date === selectedDate);
  const visiblePlanTasks = planTasks.slice(0, 4);
  const upcoming = useMemo(() => getUpcomingRoutine(routine, clock, today), [clock, routine, today]);

  const subjectProgress = useMemo(() => {
    const totals = new Map<string, number>();
    for (const log of logs) {
      const minutes = Math.max(0, Number(log.actual_minutes) || 0);
      if (!minutes) continue;
      const label = subjectLabel(subjects, log.subject_id, log.subject_name);
      totals.set(label, (totals.get(label) || 0) + minutes);
    }
    return [...totals.entries()]
      .map(([name, minutes]) => ({ name, minutes }))
      .sort((first, second) => second.minutes - first.minutes || first.name.localeCompare(second.name))
      .slice(0, 4);
  }, [logs, subjects]);
  const maxSubjectMinutes = Math.max(...subjectProgress.map((item) => item.minutes), 1);

  const stats: StatCard[] = [
    { label: "Total Subjects", value: String(subjects.length), detail: subjects.length ? "Live subject list" : "No subjects yet", icon: BookOpen, tone: "subjects" },
    { label: "Study Time Today", value: formatMinutes(studyToday), detail: today ? dateLabel(today, { weekday: "short", day: "numeric", month: "short" }) : "Loading date…", icon: Clock3, tone: "time" },
    { label: "Overall Progress", value: progress === null ? "—" : `${progress}%`, detail: tasks.length ? `${completedTaskCount}/${tasks.length} task completed` : "No task data", icon: CheckCircle2, tone: "progress" },
    { label: "Day Streak", value: `${streak}`, detail: streak === 1 ? "day with study logs" : "days with study logs", icon: Flame, tone: "streak" },
  ];

  return (
    <div className="planner-dashboard">
      <section className="planner-welcome" aria-labelledby="planner-welcome-title">
        <div className="planner-welcome-art" aria-hidden="true"><span className="planner-moon" /><span className="planner-hill planner-hill-one" /><span className="planner-hill planner-hill-two" /><span className="planner-stars" /></div>
        <div className="planner-welcome-copy">
          <p><Sparkles size={17} /> Personal daily study planner</p>
          <h1 id="planner-welcome-title">{clock ? greeting(clock.minutes) : "Welcome back!"}</h1>
          <span>Stay focused, study consistently, and build your next milestone.</span>
        </div>
        <div className="planner-welcome-quote">Dream big.<br /><strong>Study hard.</strong></div>
      </section>

      <section className="planner-stat-grid" aria-label="Live study overview">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
          <article key={label} className={`planner-stat-card stat-${tone}`}>
            <span className="planner-stat-icon"><Icon size={25} /></span>
            <div><strong>{value}</strong><p>{label}</p><small>{detail}</small></div>
            <i className="planner-stat-spark" aria-hidden="true" />
          </article>
        ))}
      </section>

      <section className="planner-main-grid">
        <article className="planner-glass-card planner-overview-card">
          <header className="planner-card-header">
            <div><p><BarChart3 size={18} /> Study Progress Overview</p><span>Actual study logs from the selected period</span></div>
            <div className="planner-overview-actions">
              <label className="planner-period-select">
                <select value={chartDays} onChange={(event) => setChartDays(Number(event.target.value) as 7 | 30)} aria-label="Study chart time range">
                  <option value="30">Last 30 Days</option>
                  <option value="7">Last 7 Days</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
              <Link href="/manage/analytics">Reports <ArrowRight size={15} /></Link>
            </div>
          </header>
          <div className="planner-overview-body">
            <ProgressRing progress={progress} />
            <StudyHistoryChart key={chartDays} series={studySeries} />
          </div>
        </article>

        <article className="planner-glass-card planner-plan-card">
          <header className="planner-card-header">
            <div><p><CalendarDays size={18} /> {selectedDate && selectedDate === today ? "Today’s Study Plan" : "Study Plan"}</p><span>{selectedDate ? dateLabel(selectedDate, { weekday: "long", day: "numeric", month: "short" }) : "Loading date…"}</span></div>
            <Link href="/manage/tasks">View all <ArrowRight size={15} /></Link>
          </header>
          {planTasks.length > 0 ? (
            <div className="planner-task-list">
              {visiblePlanTasks.map((task) => {
                const complete = isTaskDone(task);
                return (
                  <article key={task.id} className={`planner-live-task${complete ? " is-complete" : ""}`}>
                    <button type="button" disabled={busy || complete} onClick={() => void onCompleteTask(task)} aria-label={complete ? `${task.title} completed` : `${task.title} mark complete`}>
                      {complete ? <Check size={16} /> : <span />}
                    </button>
                    <div><strong>{task.title}</strong><small>{task.task_type}{task.subject_name ? ` · ${task.subject_name}` : ""}</small></div>
                    {!complete && <Link href="/manage/tasks" aria-label={`Open ${task.title}`}><ChevronRight size={16} /></Link>}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="planner-empty-state compact"><CalendarDays size={22} /><strong>No study plans for this date</strong><span>Live tasks with a matching deadline will appear here.</span><Link href="/manage/tasks"><Plus size={14} /> Add task</Link></div>
          )}
          <Link href="/manage/academic" className="planner-continue-study"><CirclePlay size={18} /> Continue Study <ArrowRight size={16} /></Link>
        </article>
      </section>

      <section className="planner-bottom-grid">
        <article className="planner-glass-card planner-subject-card">
          <header className="planner-card-header"><div><p><BookOpen size={18} /> Subject-wise Progress</p><span>Based on actual study time</span></div><Link href="/manage/analytics">View all <ArrowRight size={15} /></Link></header>
          {subjectProgress.length > 0 ? (
            <div className="planner-subject-list">
              {subjectProgress.map((subject, index) => (
                <article key={subject.name}>
                  <span className={`planner-subject-badge tone-${index % 4}`}><BookOpen size={16} /></span>
                  <div><strong>{subject.name}</strong><i><b style={{ width: `${subject.minutes / maxSubjectMinutes * 100}%` }} /></i></div>
                  <small>{formatMinutes(subject.minutes)}</small>
                </article>
              ))}
            </div>
          ) : <div className="planner-empty-state mini"><BookOpen size={21} /><strong>কোনো subject study data নেই</strong><Link href="/manage/academic">পড়া যোগ করো <ArrowRight size={14} /></Link></div>}
        </article>

        <article className="planner-glass-card planner-schedule-card">
          <header className="planner-card-header"><div><p><CalendarClock size={18} /> Upcoming Schedule</p><span>Next live routine items</span></div><Link href="/manage/routine">View all <ArrowRight size={15} /></Link></header>
          {upcoming.length > 0 ? (
            <div className="planner-schedule-list">
              {upcoming.map((item, index) => (
                <article key={`${item.id}-${item.dateKey}`}>
                  <time><strong>{dateFromKey(item.dateKey).getUTCDate()}</strong><span>{dateLabel(item.dateKey, { month: "short" })}</span></time>
                  <i className={`schedule-dot tone-${index % 4}`} />
                  <div><strong>{item.title}</strong><span>{formatTimeRange(item.start_time, item.end_time)}</span></div>
                </article>
              ))}
            </div>
          ) : <div className="planner-empty-state mini"><CalendarClock size={21} /><strong>কোনো upcoming schedule নেই</strong><Link href="/manage/routine">রুটিন সাজাও <ArrowRight size={14} /></Link></div>}
        </article>

        <article className="planner-glass-card planner-tools-card">
          <header className="planner-card-header"><div><p><Sparkles size={18} /> Quick Tools</p><span>Use your existing planner tools</span></div></header>
          <div className="planner-tool-grid">
            <Link href="/manage/academic" className="tool-note"><NotebookIcon /><span>Study Notes</span></Link>
            <Link href="/manage/routine" className="tool-plan"><CalendarDays size={22} /><span>Update Plan</span></Link>
            <Link href="/manage/analytics" className="tool-reports"><BarChart3 size={22} /><span>View Reports</span></Link>
            <a href="#planner-settings" className="tool-settings"><Target size={22} /><span>Settings</span></a>
          </div>
        </article>
      </section>

      <section id="planner-settings" className="planner-dashboard-settings">
        <div className="planner-settings-title"><span><Trophy size={19} /></span><div><p>Planner controls</p><h2>Goals, review, and your data</h2></div></div>
        <div className="planner-settings-grid">
          <DailyGoalsPanel logs={logs} />
          <ReviewReminderPanel logs={logs} busy={busy} onReviewed={onReviewed} />
        </div>
        <DataBackupTools onRestored={onRestored} />
      </section>
    </div>
  );
}

function NotebookIcon() {
  return <ListChecks size={22} />;
}
