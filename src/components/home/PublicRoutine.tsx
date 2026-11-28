"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Eye } from "lucide-react";
import type { RoutineItem, Subject } from "@/lib/types";
import { formatTime12 } from "@/lib/time-format";
import { getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, WEEKDAYS } from "@/lib/routine-time";

type PublicRoutineProps = {
  routine: RoutineItem[];
  subjects: Subject[];
  loading: boolean;
  dataUnavailable: boolean;
};

type RoutineFilter = "today" | "all" | (typeof WEEKDAYS)[number];

const shortDays = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

function getRoutineDayOrder(day: string) {
  if (day.includes("রবিবার") && day.includes("বৃহস্পতিবার")) return -1;
  const index = WEEKDAYS.findIndex((weekday) => day.includes(weekday));
  return index < 0 ? WEEKDAYS.length : index;
}

export default function PublicRoutine({ routine, subjects, loading, dataUnavailable }: PublicRoutineProps) {
  const [clock, setClock] = useState(() => getDhakaRoutineClock());
  const [selectedDay, setSelectedDay] = useState<RoutineFilter>("today");

  useEffect(() => {
    const updateClock = () => setClock(getDhakaRoutineClock());
    updateClock();
    const intervalId = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const activeItem = useMemo(() => routine.find((item) => {
    if (!routineMatchesDay(item.day, clock.day)) return false;
    const start = routineTimeToMinutes(item.start_time);
    const end = routineTimeToMinutes(item.end_time);
    if (start === null || end === null || start === end) return false;
    return start < end
      ? clock.minutes >= start && clock.minutes < end
      : clock.minutes >= start || clock.minutes < end;
  }), [clock, routine]);

  const visibleRoutine = useMemo(() => routine
    .filter((item) => {
      if (selectedDay === "all") return true;
      return routineMatchesDay(item.day, selectedDay === "today" ? clock.day : selectedDay);
    })
    .sort((a, b) => {
      if (selectedDay === "all") {
        const dayDifference = getRoutineDayOrder(a.day) - getRoutineDayOrder(b.day);
        if (dayDifference !== 0) return dayDifference;
      }
      const aStart = routineTimeToMinutes(a.start_time);
      const bStart = routineTimeToMinutes(b.start_time);
      if (aStart !== null && bStart !== null) return aStart - bStart;
      return a.sort_order - b.sort_order;
    }), [clock.day, routine, selectedDay]);

  const filters: { id: RoutineFilter; label: string }[] = [
    { id: "today", label: `আজ · ${clock.day}` },
    { id: "all", label: "সব দিন" },
    ...WEEKDAYS.map((day, index) => ({ id: day, label: shortDays[index] })),
  ];

  function subjectName(item: RoutineItem) {
    return item.subject_name?.trim() || subjects.find((subject) => subject.id === item.subject_id)?.name || "";
  }

  return (
    <section id="routine" className="mt-10 scroll-mt-24 sm:mt-12">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-green-500">Weekly overview</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-green-950">
            <CalendarDays size={23} className="text-green-500" /> সাপ্তাহিক রুটিন
          </h2>
          <p className="mt-1 text-sm text-slate-500">আজকের কাজ আগে দেখো, দরকার হলে অন্য দিন বেছে নাও।</p>
        </div>
        <span className="w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-600">
          <Eye size={14} className="mr-1 inline" /> সবার জন্য · শুধু দেখা যাবে
        </span>
      </div>

      <div className="card p-3.5 sm:p-4">
        <div className="mobile-tab-scroll flex gap-2 overflow-x-auto pb-1" role="group" aria-label="রুটিনের দিন বেছে নিন">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={selectedDay === id}
              onClick={() => setSelectedDay(id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${selectedDay === id ? "border-green-500 bg-green-500 text-green-950 shadow-sm shadow-green-900/15" : "border-slate-200 bg-white/5 text-slate-500 hover:border-green-500/40 hover:text-green-500"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-green-500/10" />)}
          </div>
        ) : visibleRoutine.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-green-500/25 px-4 py-10 text-center">
            <p className="font-bold text-slate-600">{dataUnavailable ? "লাইভ রুটিন এখন পাওয়া যাচ্ছে না।" : "এই দিনের জন্য কোনো রুটিন প্রকাশিত হয়নি।"}</p>
            <p className="mt-1 text-xs text-slate-500">{dataUnavailable ? "সংযোগ ফিরলে এখানে শুধু প্রকাশিত রুটিন দেখা যাবে।" : "অন্য দিন দেখতে উপরের বাটন ব্যবহার করো।"}</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRoutine.map((item) => {
              const isActive = item.id === activeItem?.id;
              const subject = subjectName(item);
              return (
                <article
                  key={item.id}
                  className={`relative flex min-w-0 gap-3 overflow-hidden rounded-2xl border p-3 transition sm:p-3.5 ${isActive ? "border-green-500/45 bg-green-500/10 shadow-sm shadow-green-950/10" : "border-slate-100 bg-white/5 hover:border-green-500/25 hover:bg-green-500/5"}`}
                >
                  {isActive && <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-lime-300 to-green-500" />}
                  <div className="flex w-[78px] shrink-0 flex-col items-center justify-center rounded-xl border border-green-500/15 bg-green-500/10 px-1.5 py-2 text-center text-green-600">
                    <span className="whitespace-nowrap text-[10px] font-extrabold tabular-nums">{formatTime12(item.start_time)}</span>
                    <span className="my-0.5 text-[9px] opacity-50">থেকে</span>
                    <span className="whitespace-nowrap text-[10px] font-extrabold tabular-nums">{formatTime12(item.end_time)}</span>
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    {selectedDay === "all" && <p className="mb-0.5 truncate text-[10px] font-bold text-green-600">{item.day}</p>}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-xs font-bold leading-relaxed text-slate-800 sm:text-sm">{item.title}</h3>
                      {isActive && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500/15 px-1.5 py-1 text-[9px] font-extrabold text-green-600">
                          <Check size={10} /> এখন
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[10px] text-slate-500 sm:text-[11px]">
                      {item.category}{subject ? ` · ${subject}` : ""}
                    </p>
                    {item.notes && <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">{item.notes}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span>{selectedDay === "today" ? `${clock.day} · আজকের রুটিন` : selectedDay === "all" ? "সকল প্রকাশিত দিন" : selectedDay}</span>
          <span className="font-semibold">{loading ? "লোড হচ্ছে" : dataUnavailable ? "তথ্য পাওয়া যাচ্ছে না" : `${visibleRoutine.length} টি রুটিন`}</span>
        </div>
      </div>
    </section>
  );
}
