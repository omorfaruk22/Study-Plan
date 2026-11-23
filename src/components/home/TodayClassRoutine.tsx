"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import type { RoutineItem } from "@/lib/types";
import { formatTimeRange, getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes } from "@/lib/routine-time";

type TodayClassRoutineProps = {
  routine: RoutineItem[];
  loading: boolean;
};

export default function TodayClassRoutine({ routine, loading }: TodayClassRoutineProps) {
  const [today, setToday] = useState(() => getDhakaRoutineClock());

  useEffect(() => {
    const updateDay = () => setToday(getDhakaRoutineClock());
    const intervalId = window.setInterval(updateDay, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const classes = useMemo(() => routine
    .filter((item) => item.category === "ক্লাস রুটিন" && routineMatchesDay(item.day, today.day))
    .sort((a, b) => {
      const aStart = routineTimeToMinutes(a.start_time);
      const bStart = routineTimeToMinutes(b.start_time);
      if (aStart !== null && bStart !== null) return aStart - bStart;
      return a.sort_order - b.sort_order;
    }), [routine, today.day]);

  return (
    <section aria-label="আজকের ক্লাস রুটিন" className="card min-w-0 flex-1 p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-extrabold text-green-950 sm:text-base">
          <GraduationCap size={18} className="shrink-0 text-green-600" />
          <span className="truncate">আজকের ক্লাস</span>
        </h2>
        <span className="shrink-0 text-[10px] font-semibold text-slate-500 sm:text-xs">{today.day}</span>
      </div>

      {loading ? (
        <p className="mt-3 text-xs text-slate-500">ক্লাসের সময়সূচি লোড হচ্ছে...</p>
      ) : classes.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-green-500/20 px-3 py-2 text-xs text-slate-500">
          আজ কোনো ক্লাস নেই।
        </p>
      ) : (
        <ul className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-1.5">
          {classes.map((item) => (
            <li key={item.id} className="min-w-0 rounded-xl border border-green-500/15 bg-green-500/5 px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="whitespace-nowrap text-[10px] font-extrabold tabular-nums text-green-700">
                  {formatTimeRange(item.start_time, item.end_time)}
                </span>
                {item.subject_name && (
                  <span className="shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                    {item.subject_name}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[11px] font-bold text-slate-700" title={item.title}>{item.title}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
