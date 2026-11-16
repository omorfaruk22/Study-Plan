"use client";

import { BookOpenCheck, CalendarClock, Check, ChevronDown } from "lucide-react";
import type { StudyLog } from "@/lib/types";
import { localDateKey } from "@/components/manage/analytics/chart-utils";
import useResponsiveDisclosure from "@/components/manage/useResponsiveDisclosure";

function dayDifference(from: string, to: string) {
  const first = new Date(`${from}T12:00:00`).getTime();
  const second = new Date(`${to}T12:00:00`).getTime();
  return Math.round((second - first) / 86_400_000);
}

function addDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day + days, 12);
  return localDateKey(date);
}

function trackName(track?: string | null) {
  if (track === "academic") return "Academic";
  if (track === "duet_department") return "DUET Department";
  if (track === "duet_non_department") return "DUET Non-Department";
  return "পড়া";
}

type ReviewReminderPanelProps = {
  logs: StudyLog[];
  busy: boolean;
  onReviewed: (log: StudyLog, today: string, nextReview: string) => Promise<boolean>;
};

export default function ReviewReminderPanel({ logs, busy, onReviewed }: ReviewReminderPanelProps) {
  const [open, setOpen] = useResponsiveDisclosure();
  const today = localDateKey(new Date());
  const reminders = logs
    .filter((log) => Boolean(log.review_due_date) && dayDifference(today, log.review_due_date || "") <= 7)
    .sort((first, second) => (first.review_due_date || "").localeCompare(second.review_due_date || ""));
  const dueCount = reminders.filter((log) => dayDifference(today, log.review_due_date || "") <= 0).length;

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="mobile-disclosure card mt-3 overflow-hidden p-3.5 sm:mt-4 sm:p-5">
      <summary className="sm:hidden">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-green-700"><CalendarClock size={14} /> Review reminders</span>
          <span className="mt-1 block text-sm font-black text-green-950">আবার পড়ার সময় <span className="font-semibold text-slate-500">· {dueCount}টি বাকি</span></span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-green-600" />
      </summary>
      <div className="mobile-disclosure-content">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-green-700"><CalendarClock size={15} /> Review reminders · ৩ দিনের cycle</p>
          <h2 className="mt-1 text-lg font-black text-green-950">আবার পড়ার সময়</h2>
        </div>
        {dueCount > 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">{dueCount}টি বাকি</span>}
      </div>
      {reminders.length === 0 ? (
        <p className="mt-3 rounded-xl bg-green-50 px-3 py-3 text-xs leading-5 text-slate-500">পড়া session save হলে ৩ দিন পর এখানে reminder আসবে।</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {reminders.slice(0, 6).map((log) => {
            const daysAway = dayDifference(today, log.review_due_date || today);
            const isDue = daysAway <= 0;
            const timeLabel = daysAway < 0 ? `${Math.abs(daysAway)} দিন overdue` : daysAway === 0 ? "আজ আবার পড়ো" : `${daysAway} দিন পরে`;
            return (
              <article key={log.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50/50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-green-950">{log.topic}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{trackName(log.study_track)} · {log.review_due_date} · {timeLabel}</p>
                </div>
                {isDue ? (
                  <button type="button" disabled={busy} onClick={() => void onReviewed(log, today, addDays(today, 3))} className="btn btn-soft shrink-0 px-2.5 py-2 text-[11px] disabled:opacity-50">
                    <Check size={14} /> আবার পড়েছি
                  </button>
                ) : <BookOpenCheck size={17} className="shrink-0 text-green-600" aria-hidden="true" />}
              </article>
            );
          })}
        </div>
      )}
      {reminders.length > 6 && <p className="mt-2 text-right text-[11px] text-slate-500">আরও {reminders.length - 6}টি reminder আছে।</p>}
      <p className="mt-2 text-[10px] text-slate-400">“আবার পড়েছি” চাপলে পরের reminder ৩ দিন পরে আসবে।</p>
      </div>
    </details>
  );
}
