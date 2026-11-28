"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, GraduationCap } from "lucide-react";
import type { RoutineItem } from "@/lib/types";
import { getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, WEEKDAYS } from "@/lib/routine-time";

type TodayClassRoutineProps = {
  routine: RoutineItem[];
  loading: boolean;
};

function isClassInProgress(item: RoutineItem, currentMinutes: number) {
  const start = routineTimeToMinutes(item.start_time);
  const end = routineTimeToMinutes(item.end_time);
  if (start === null || end === null || start === end) return false;
  return start < end
    ? currentMinutes >= start && currentMinutes < end
    : currentMinutes >= start || currentMinutes < end;
}

export default function TodayClassRoutine({ routine, loading }: TodayClassRoutineProps) {
  const [today, setToday] = useState(() => getDhakaRoutineClock());
  const [dayOffset, setDayOffset] = useState(0);

  const todayIndex = WEEKDAYS.indexOf(today.day);
  const selectedDay = WEEKDAYS[(todayIndex + dayOffset) % WEEKDAYS.length];

  useEffect(() => {
    const updateDay = () => setToday(getDhakaRoutineClock());
    const intervalId = window.setInterval(updateDay, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setDayOffset(0);
  }, [today.day]);

  const classes = useMemo(() => routine
    .filter((item) => item.category === "ক্লাস রুটিন" && routineMatchesDay(item.day, selectedDay))
    .sort((a, b) => {
      const aStart = routineTimeToMinutes(a.start_time);
      const bStart = routineTimeToMinutes(b.start_time);
      if (aStart !== null && bStart !== null) return aStart - bStart;
      return a.sort_order - b.sort_order;
    }), [routine, selectedDay]);

  return (
    <section aria-label={`${selectedDay} এর ক্লাস রুটিন`} className="card min-w-0 flex-1 p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold text-green-950 sm:text-xl">
          <GraduationCap size={20} className="shrink-0 text-green-600" />
          <span className="shrink-0">{dayOffset === 0 ? "আজকের ক্লাস" : "ক্লাস রুটিন"}</span>
          <span className="truncate text-base font-semibold text-green-700 sm:text-lg">{selectedDay}</span>
        </h2>
        <button
          type="button"
          aria-label={`${WEEKDAYS[(WEEKDAYS.indexOf(selectedDay) + 1) % WEEKDAYS.length]} এর ক্লাস দেখুন`}
          title="পরের দিনের ক্লাস দেখুন"
          onClick={() => setDayOffset((offset) => (offset + 1) % WEEKDAYS.length)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-green-500/20 bg-green-500/10 text-green-700 transition hover:border-green-500/40 hover:bg-green-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-base text-slate-500">ক্লাসের সময়সূচি লোড হচ্ছে...</p>
      ) : classes.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-green-500/20 px-3 py-2.5 text-base text-slate-500">
          {dayOffset === 0 ? "আজ কোনো ক্লাস নেই।" : `${selectedDay} কোনো ক্লাস নেই।`}
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
          {classes.map((item) => {
            const isActive = dayOffset === 0 && isClassInProgress(item, today.minutes);

            return (
              <li
                key={item.id}
                aria-current={isActive ? "true" : undefined}
                aria-label={isActive ? `${item.title} · এখন চলছে` : item.title}
                className={`min-w-0 rounded-xl border px-2.5 py-1.5 transition-colors duration-300 ${isActive
                  ? "border-green-400/60 bg-green-500/15 shadow-[0_0_18px_rgba(34,197,94,0.18)] ring-1 ring-green-400/20"
                  : "border-green-500/15 bg-green-500/5"}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="whitespace-nowrap text-[11px] font-semibold tabular-nums text-green-700 sm:text-xs">
                    {item.start_time}–{item.end_time}
                  </span>
                  {item.subject_name && (
                    <span className="max-w-[96px] shrink rounded-full bg-green-500/10 px-1 py-0.5 text-[10px] font-medium text-green-700 truncate">
                      {item.subject_name}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex min-w-0 items-start gap-1.5">
                  {isActive && (
                    <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.85)]" />
                  )}
                  <p className="line-clamp-3 min-w-0 text-sm font-medium leading-5 text-slate-700 sm:text-base" title={item.title}>{item.title}</p>
                  {isActive && <span className="sr-only">এখন চলছে</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
