"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import type { StudyLog } from "@/lib/types";
import { localDateKey } from "@/components/manage/analytics/chart-utils";

const weekdays = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours} ঘণ্টা${remainder ? ` ${remainder} মিনিট` : ""}` : `${remainder} মিনিট`;
}

export default function StudyCalendar({ logs }: { logs: StudyLog[] }) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1, 12);
  });
  const [selected, setSelected] = useState(() => localDateKey(new Date()));
  const dataByDay = useMemo(() => {
    const result = new Map<string, { minutes: number; count: number; logs: StudyLog[] }>();
    for (const log of logs) {
      const total = result.get(log.study_date) || { minutes: 0, count: 0, logs: [] };
      total.minutes += Math.max(0, Number(log.actual_minutes) || 0);
      total.count += 1;
      total.logs.push(log);
      result.set(log.study_date, total);
    }
    return result;
  }, [logs]);

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay.getDay(), 12);
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    const key = localDateKey(day);
    return { date: day, key, inside: day.getMonth() === month.getMonth(), data: dataByDay.get(key) };
  });
  const selectedData = dataByDay.get(selected);
  const selectedDate = new Date(`${selected}T12:00:00`);
  const monthEntries = [...dataByDay.entries()].filter(([key]) => key.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`));
  const maxMinutes = Math.max(1, ...monthEntries.map(([, value]) => value.minutes));

  function navigate(amount: number) {
    const next = shiftMonth(month, amount);
    setMonth(next);
    setSelected(localDateKey(next));
  }

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-green-700"><CalendarDays size={15} /> Study calendar</p>
          <h2 className="mt-1 text-lg font-black text-green-950">দিনভিত্তিক পড়ার হিসাব</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => navigate(-1)} aria-label="আগের মাস" className="btn btn-plain h-9 w-9 p-0"><ArrowLeft size={16} /></button>
          <span className="min-w-[112px] text-center text-sm font-extrabold text-green-950">{formatMonth(month)}</span>
          <button type="button" onClick={() => navigate(1)} aria-label="পরের মাস" className="btn btn-plain h-9 w-9 p-0"><ArrowRight size={16} /></button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2" role="grid" aria-label={`${formatMonth(month)} পড়ার calendar`}>
        {weekdays.map((weekday) => <div key={weekday} className="py-1 text-center text-[10px] font-bold text-slate-500 sm:text-xs">{weekday}</div>)}
        {days.map(({ date, key, inside, data }) => {
          const strength = data ? data.minutes / maxMinutes : 0;
          const tone = !data ? "bg-green-50/50 text-slate-400" : strength > .66 ? "bg-green-700 text-white" : strength > .33 ? "bg-green-300 text-green-950" : "bg-emerald-100 text-green-900";
          const current = key === localDateKey(new Date());
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-pressed={isSelected}
              aria-label={`${key}: ${data ? durationLabel(data.minutes) : "পড়ার log নেই"}`}
              onClick={() => { setSelected(key); if (!inside) setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12)); }}
              className={`flex min-h-[58px] flex-col items-center justify-center rounded-xl border p-1 transition sm:min-h-[70px] ${tone} ${inside ? "" : "opacity-45"} ${current ? "ring-2 ring-green-500 ring-offset-1" : "border-transparent"} ${isSelected ? "!border-green-900 !ring-2 !ring-lime-400" : ""}`}
            >
              <span className="text-xs font-extrabold sm:text-sm">{date.getDate().toLocaleString("bn-BD")}</span>
              {data && <span className="mt-0.5 text-[9px] font-bold leading-3 sm:text-[10px]">{data.count} log</span>}
              {data && <span className="text-[9px] leading-3 sm:text-[10px]">{data.minutes}m</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/50 p-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-extrabold text-green-950">{selectedDate.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p className="text-xs font-bold text-green-700">{selectedData ? `${durationLabel(selectedData.minutes)} · ${selectedData.count}টি session` : "কোনো পড়ার log নেই"}</p>
        </div>
        {selectedData && <div className="mt-2 space-y-1.5">{selectedData.logs.map((log) => <p key={log.id} className="truncate text-xs text-slate-600">{log.topic} · {log.actual_minutes} মিনিট</p>)}</div>}
      </div>
      <p className="mt-2 text-[10px] text-slate-400">গাঢ় সবুজ দিনগুলোতে তুলনামূলক বেশি সময় পড়া হয়েছে। দিন চাপলে সেই দিনের session দেখা যাবে।</p>
    </section>
  );
}
