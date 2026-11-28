"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Sparkles } from "lucide-react";
import type { RoutineItem, Subject } from "@/lib/types";
import { formatTime12 } from "@/lib/time-format";
import {
  formatTimeRange,
  getDhakaRoutineClock,
  routineMatchesDay,
  routineTimeToMinutes,
  type DhakaRoutineClock,
} from "@/lib/routine-time";

type CurrentRoutinePanelProps = {
  routine: RoutineItem[];
  subjects: Subject[];
};

function sortRoutineItems(first: RoutineItem, second: RoutineItem) {
  const firstStart = routineTimeToMinutes(first.start_time);
  const secondStart = routineTimeToMinutes(second.start_time);
  if (firstStart !== null && secondStart !== null) return firstStart - secondStart;
  if (firstStart !== null) return -1;
  if (secondStart !== null) return 1;
  return (Number(first.sort_order) || 0) - (Number(second.sort_order) || 0);
}

function getSpecialTimeBlock(items: RoutineItem[], now: number): RoutineItem[] {
  for (let index = 0; index < items.length; index += 1) {
    const start = routineTimeToMinutes(items[index].start_time);
    if (start === null) continue;

    let lastIndex = index;
    while (
      lastIndex < items.length - 1 &&
      routineTimeToMinutes(items[lastIndex].end_time) === null &&
      routineTimeToMinutes(items[lastIndex + 1].start_time) === null
    ) {
      lastIndex += 1;
    }

    const end = routineTimeToMinutes(items[lastIndex].end_time) ??
      (lastIndex + 1 < items.length ? routineTimeToMinutes(items[lastIndex + 1].start_time) : null);
    if (end !== null && now >= start && now < end) return items.slice(index, lastIndex + 1);
  }

  return [];
}

function isWithinTime(start: number, end: number, now: number) {
  if (start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}

function getProgress(start: number, end: number, now: number) {
  const duration = (end - start + 1440) % 1440;
  const elapsed = (now - start + 1440) % 1440;
  return duration === 0 ? 0 : Math.min(100, Math.max(0, (elapsed / duration) * 100));
}

function getSubjectLabel(subjects: Subject[], item: RoutineItem) {
  return item.subject_name?.trim() || subjects.find((subject) => subject.id === item.subject_id)?.name || "";
}

function minutesLabel(minutes: number) {
  if (minutes < 60) return `${minutes} মিনিট`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} ঘন্টা ${remainder} মিনিট` : `${hours} ঘন্টা`;
}

export default function CurrentRoutinePanel({ routine, subjects }: CurrentRoutinePanelProps) {
  const [clock, setClock] = useState<DhakaRoutineClock | null>(null);

  useEffect(() => {
    const updateClock = () => setClock(getDhakaRoutineClock());
    updateClock();
    const intervalId = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const todayItems = useMemo(() => {
    if (!clock) return [];
    return routine
      .filter((item) => routineMatchesDay(item.day, clock.day))
      .sort(sortRoutineItems);
  }, [clock, routine]);

  const activeItem = todayItems.find((item) => {
    if (!clock) return false;
    const start = routineTimeToMinutes(item.start_time);
    const end = routineTimeToMinutes(item.end_time);
    return start !== null && end !== null && isWithinTime(start, end, clock.minutes);
  });

  const nextItem = clock && !activeItem
    ? todayItems
      .filter((item) => {
        const start = routineTimeToMinutes(item.start_time);
        return start !== null && start > clock.minutes;
      })
      .sort(sortRoutineItems)[0]
    : undefined;

  const specialBlock = clock && !activeItem
    ? getSpecialTimeBlock(todayItems, clock.minutes)
    : [];

  const activeStart = activeItem ? routineTimeToMinutes(activeItem.start_time) : null;
  const activeEnd = activeItem ? routineTimeToMinutes(activeItem.end_time) : null;
  const progress = clock && activeStart !== null && activeEnd !== null
    ? getProgress(activeStart, activeEnd, clock.minutes)
    : 0;

  const agendaItems = useMemo(() => {
    if (!clock) return [];
    return todayItems
      .filter((item) => {
        const start = routineTimeToMinutes(item.start_time);
        return start !== null && (start >= clock.minutes || item.id === activeItem?.id);
      })
      .sort(sortRoutineItems)
      .slice(0, 3);
  }, [activeItem?.id, clock, todayItems]);

  return (
    <aside className="planner-routine-live card relative h-full overflow-hidden p-4 sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 via-lime-400 to-emerald-500" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.16em] text-green-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Live routine
          </p>
          <h2 className="mt-2 text-lg font-extrabold text-green-950">আজকের রুটিন</h2>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-right">
          <p className="flex items-center justify-end gap-1 text-[10px] font-bold text-green-600"><Clock3 size={12} /> Dhaka time</p>
          <p className="mt-0.5 text-sm font-extrabold tabular-nums text-green-950">{clock?.timeLabel || "--:--"}</p>
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <CalendarDays size={13} /> {clock ? `${clock.day} · ${clock.dateLabel}` : "সময় যাচাই হচ্ছে..."}
      </p>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-950/80 via-green-900/60 to-emerald-900/30 p-4 text-white">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-lime-400/10 blur-2xl" />
        <div className="relative">
          {activeItem ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-300 px-2.5 py-1 text-[11px] font-extrabold text-green-950">
                <Sparkles size={12} /> এখন চলছে
              </span>
              <h3 className="mt-3 text-lg font-extrabold leading-snug">{activeItem.title}</h3>
              <p className="mt-1 text-xs text-green-100/80">{formatTimeRange(activeItem.start_time, activeItem.end_time)}</p>
              <p className="mt-2 text-xs text-green-100/80">
                {activeItem.category}{getSubjectLabel(subjects, activeItem) ? ` · ${getSubjectLabel(subjects, activeItem)}` : ""}
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-lime-300 transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : specialBlock.length > 0 ? (
            <>
              <span className="inline-flex rounded-full bg-amber-300 px-2.5 py-1 text-[11px] font-extrabold text-amber-950">এই সময়ের রুটিন</span>
              <div className="mt-3 space-y-2">
                {specialBlock.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="mt-1 text-[11px] text-green-100/80">{formatTimeRange(item.start_time, item.end_time)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-green-100/70">এই অংশে নির্দিষ্ট ঘড়ির সময়ের বদলে “মাগরিব”-এর মতো সময় লেখা আছে, তাই পুরো সময়ের ব্লক দেখানো হচ্ছে।</p>
            </>
          ) : nextItem && clock ? (
            <>
              <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-green-100">পরবর্তী রুটিন</span>
              <h3 className="mt-3 text-lg font-extrabold leading-snug">{nextItem.title}</h3>
              <p className="mt-1 text-xs text-green-100/80">{formatTimeRange(nextItem.start_time, nextItem.end_time)}</p>
              <p className="mt-3 text-xs font-semibold text-lime-200">
                শুরু হতে {minutesLabel((routineTimeToMinutes(nextItem.start_time) || clock.minutes) - clock.minutes)} বাকি
              </p>
              <p className="mt-2 text-xs text-green-100/70">
                {nextItem.category}{getSubjectLabel(subjects, nextItem) ? ` · ${getSubjectLabel(subjects, nextItem)}` : ""}
              </p>
            </>
          ) : (
            <>
              <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-green-100">{todayItems.length ? "আজকের রুটিন শেষ" : "আজ কোনো রুটিন নেই"}</span>
              <p className="mt-3 text-sm font-semibold text-green-50">{todayItems.length ? "আজকের নির্দিষ্ট সময়ের কাজগুলো শেষ হয়েছে।" : "রুটিন যোগ করলে এখানে আজকের সময়সূচি দেখা যাবে।"}</p>
              {todayItems.length > 0 && todayItems.every((item) => routineTimeToMinutes(item.start_time) === null) && (
                <p className="mt-2 text-xs text-green-100/70">আজকের সময়গুলো ঘড়ির সময় হিসেবে দেওয়া নেই, তাই চলতি কাজ শনাক্ত করা যাচ্ছে না।</p>
              )}
            </>
          )}
        </div>
      </div>

      {agendaItems.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">আজকের সময়সূচি</p>
          <div className="space-y-1.5">
            {agendaItems.map((item) => (
              <div key={item.id} className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-colors ${item.id === activeItem?.id ? "border-green-500/30 bg-green-500/10" : "border-slate-100 bg-slate-50 hover:bg-green-50"}`}>
                <span className="w-[76px] shrink-0 text-[10px] font-bold tabular-nums text-green-600">{formatTime12(item.start_time)}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{item.title}</span>
                {item.id === activeItem?.id && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
