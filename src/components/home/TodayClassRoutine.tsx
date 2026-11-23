"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, GraduationCap } from "lucide-react";
import { Hind_Siliguri } from "next/font/google";
import type { RoutineItem } from "@/lib/types";
import { getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, WEEKDAYS } from "@/lib/routine-time";

const routineFont = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type TodayClassRoutineProps = {
  routine: RoutineItem[];
  loading: boolean;
};

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
    <section aria-label={`${selectedDay} এর ক্লাস রুটিন`} className={`${routineFont.className} card min-w-0 flex-1 p-3.5 sm:p-4`}>
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
        <ul className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
          {classes.map((item) => (
            <li key={item.id} className="min-w-0 rounded-xl border border-green-500/15 bg-green-500/5 px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="whitespace-nowrap text-[11px] font-semibold tabular-nums text-green-700 sm:text-xs">
                  {item.start_time}–{item.end_time}
                </span>
                {item.subject_name && (
                  <span className="shrink-0 rounded-full bg-green-500/10 px-1 py-0.5 text-[10px] font-medium text-green-700">
                    {item.subject_name}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-3 text-sm font-medium leading-5 text-slate-700 sm:text-base" title={item.title}>{item.title}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
