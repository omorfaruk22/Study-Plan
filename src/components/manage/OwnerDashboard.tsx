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
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Clock3,
  GraduationCap,
  NotebookPen,
  Plus,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import PlannerSettingsPanel from "@/components/manage/PlannerSettingsPanel";
import { formatMinutes, subjectLabel } from "@/components/manage/analytics/chart-utils";
import { addDaysToDateKey, formatTimeRange, getDhakaDateKey, getDhakaRoutineClock, getDhakaWeekdayForDateKey, routineMatchesDay, routineTimeToMinutes, type DhakaRoutineClock } from "@/lib/routine-time";
import { resolveStudyTrack } from "@/lib/study-track";
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
type PlanEntry =
  | { kind: "task"; item: StudyTask }
  | { kind: "routine"; item: RoutineItem };

function isTaskDone(task: StudyTask) {
  return task.status === "সম্পন্ন" || task.status === "জমা হয়েছে";
}

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00Z`);
}

function greeting(minutes: number) {
  if (minutes < 12 * 60) return { lead: "Good", accent: "Morning!" };
  if (minutes < 17 * 60) return { lead: "Good", accent: "Afternoon!" };
  return { lead: "Good", accent: "Evening!" };
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

function sortRoutineItems(first: RoutineItem, second: RoutineItem) {
  const firstStart = routineTimeToMinutes(first.start_time);
  const secondStart = routineTimeToMinutes(second.start_time);
  if (firstStart !== null && secondStart !== null) return firstStart - secondStart;
  if (firstStart !== null) return -1;
  if (secondStart !== null) return 1;
  return (Number(first.sort_order) || 0) - (Number(second.sort_order) || 0);
}

function getRoutineForDate(routine: RoutineItem[], dateKey: string) {
  const day = getDhakaWeekdayForDateKey(dateKey);
  if (!day) return [];
  return routine
    .filter((item) => routineMatchesDay(item.day, day))
    .sort(sortRoutineItems);
}

function getUpcomingRoutine(routine: RoutineItem[], clock: DhakaRoutineClock | null, today: string) {
  if (!clock || !today) return [] as UpcomingItem[];
  const occurrences: UpcomingItem[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const dateKey = addDaysToDateKey(today, offset);
    const day = getDhakaWeekdayForDateKey(dateKey);
    if (!day) continue;
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
      return sortRoutineItems(first, second);
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

  const welcomeGreeting = clock ? greeting(clock.minutes) : { lead: "Welcome", accent: "back!" };
  const progress = taskProgress(tasks);
  const studyToday = logs
    .filter((log) => Boolean(today) && log.study_date === today)
    .reduce((total, log) => total + Math.max(0, Number(log.actual_minutes) || 0), 0);
  const savedStudyTotals = useMemo(() => {
    const totals = { academic: 0, duet: 0, total: 0 };
    for (const log of logs) {
      const minutes = Math.max(0, Number(log.actual_minutes) || 0);
      totals.total += minutes;
      const track = resolveStudyTrack(log, subjects);
      if (track === "academic") totals.academic += minutes;
      if (track === "duet_department" || track === "duet_non_department") totals.duet += minutes;
    }
    return totals;
  }, [logs, subjects]);
  const studySeries = useMemo(() => buildStudySeries(logs, today, chartDays), [chartDays, logs, today]);
  const planTasks = useMemo(() => tasks.filter((task) => task.due_date === selectedDate), [selectedDate, tasks]);
  const selectedRoutine = useMemo(() => getRoutineForDate(routine, selectedDate), [routine, selectedDate]);
  const planEntries = useMemo<PlanEntry[]>(() => [
    ...planTasks.map((item) => ({ kind: "task" as const, item })),
    ...selectedRoutine.map((item) => ({ kind: "routine" as const, item })),
  ].slice(0, 4), [planTasks, selectedRoutine]);
  const upcoming = useMemo(() => getUpcomingRoutine(routine, clock, today), [clock, routine, today]);

  const subjectProgress = useMemo(() => {
    const totals = new Map<string, number>();
    for (const log of logs) {
      const minutes = Math.max(0, Number(log.actual_minutes) || 0);
      if (!minutes) continue;
      const label = subjectLabel(subjects, log.subject_id, log.subject_name);
      totals.set(label, (totals.get(label) || 0) + minutes);
    }
    const totalMinutes = [...totals.values()].reduce((total, minutes) => total + minutes, 0);
    return [...totals.entries()]
      .map(([name, minutes]) => ({
        name,
        minutes,
        share: totalMinutes > 0 ? Math.round(minutes / totalMinutes * 100) : 0,
      }))
      .sort((first, second) => second.minutes - first.minutes || first.name.localeCompare(second.name))
      .slice(0, 4);
  }, [logs, subjects]);
  const maxSubjectMinutes = Math.max(...subjectProgress.map((item) => item.minutes), 1);

  const stats: StatCard[] = [
    { label: "Total Subjects", value: String(subjects.length), detail: subjects.length ? "Live subject list" : "No subjects yet", icon: BookOpen, tone: "subjects" },
    { label: "Academic Study", value: formatMinutes(savedStudyTotals.academic), detail: savedStudyTotals.academic ? "All saved academic logs" : "No saved academic session", icon: NotebookPen, tone: "time" },
    { label: "DUET Study", value: formatMinutes(savedStudyTotals.duet), detail: savedStudyTotals.duet ? "Department + Non-Department" : "No saved DUET session", icon: GraduationCap, tone: "progress" },
    { label: "Total Study Time", value: formatMinutes(savedStudyTotals.total), detail: studyToday > 0 ? `Today: ${formatMinutes(studyToday)}` : "All saved study logs", icon: Clock3, tone: "streak" },
  ];

  return (
    <div className="planner-dashboard">
      <section className="planner-welcome" aria-labelledby="planner-welcome-title">
        <div className="planner-welcome-copy">
          <p><Sparkles size={16} /> Personal daily study planner</p>
          <div className="planner-welcome-title-row">
            <span className="planner-welcome-wave" aria-hidden="true">👋</span>
            <h1 id="planner-welcome-title"><span>{welcomeGreeting.lead}</span> <em>{welcomeGreeting.accent}</em></h1>
          </div>
          <span>Stay focused, study hard, and achieve your dreams.</span>
        </div>
        <div className="planner-welcome-quote">Dream Big…<br /><strong>Study Hard…</strong></div>
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
            <Link href={planTasks.length > 0 ? "/manage/tasks" : "/manage/routine"}>View all <ArrowRight size={15} /></Link>
          </header>
          {planEntries.length > 0 ? (
            <div className="planner-task-list">
              {planEntries.map((entry) => {
                if (entry.kind === "routine") {
                  const item = entry.item;
                  return (
                    <article key={`routine-${item.id}`} className="planner-live-task planner-live-routine">
                      <span className="planner-routine-icon"><Clock3 size={15} /></span>
                      <div><strong>{item.title}</strong><small>{formatTimeRange(item.start_time, item.end_time)}{item.category ? ` · ${item.category}` : ""}</small></div>
                      <Link href="/manage/routine" aria-label={`Open ${item.title}`}><ChevronRight size={16} /></Link>
                    </article>
                  );
                }

                const task = entry.item;
                const complete = isTaskDone(task);
                return (
                  <article key={`task-${task.id}`} className={`planner-live-task${complete ? " is-complete" : ""}`}>
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
            <div className="planner-empty-state compact"><CalendarDays size={22} /><strong>No study plans for this date</strong><span>Live tasks or routine items for the selected date will appear here.</span><Link href="/manage/routine"><Plus size={14} /> Add routine</Link></div>
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
                <article key={subject.name} className={`planner-subject-row tone-${index % 4}`}>
                  <span className={`planner-subject-badge tone-${index % 4}`}><BookOpen size={16} /></span>
                  <div><strong>{subject.name}</strong><i><b style={{ width: `${subject.minutes / maxSubjectMinutes * 100}%` }} /></i></div>
                  <small aria-label={`${formatMinutes(subject.minutes)} logged`}><b>{subject.share}%</b><span>{formatMinutes(subject.minutes)}</span></small>
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
            <Link href="/manage/notes" className="tool-note"><NotebookPen size={22} /><span>Add Note</span></Link>
            <Link href="/manage/routine" className="tool-plan"><CalendarDays size={22} /><span>Update Plan</span></Link>
            <Link href="/manage/analytics" className="tool-reports"><BarChart3 size={22} /><span>View Reports</span></Link>
            <Link href="/manage/settings" className="tool-settings"><Settings size={22} /><span>Settings</span></Link>
          </div>
        </article>
      </section>

      <PlannerSettingsPanel id="planner-settings" logs={logs} busy={busy} onRestored={onRestored} onReviewed={onReviewed} />
    </div>
  );
}
