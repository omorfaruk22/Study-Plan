"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Eye } from "lucide-react";
import type { RoutineItem, Subject } from "@/lib/types";
import { formatTimeRange, getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, WEEKDAYS } from "@/lib/routine-time";

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

function sortRoutineItems(first: RoutineItem, second: RoutineItem) {
  const firstStart = routineTimeToMinutes(first.start_time);
  const secondStart = routineTimeToMinutes(second.start_time);
  if (firstStart !== null && secondStart !== null) return firstStart - secondStart;
  if (firstStart !== null) return -1;
  if (secondStart !== null) return 1;
  return (Number(first.sort_order) || 0) - (Number(second.sort_order) || 0);
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
    .sort((first, second) => {
      if (selectedDay === "all") {
        const dayDifference = getRoutineDayOrder(first.day) - getRoutineDayOrder(second.day);
        if (dayDifference !== 0) return dayDifference;
      }
      return sortRoutineItems(first, second);
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
    <section id="routine" className="public-routine-section" aria-labelledby="public-routine-title">
      <header className="public-section-heading public-routine-heading">
        <div>
          <p><CalendarDays size={16} /> Weekly routine</p>
          <h2 id="public-routine-title">সাপ্তাহিক রুটিন</h2>
          <span>দিন বেছে নিয়ে সংরক্ষিত সময়সূচি দেখুন।</span>
        </div>
        <span className="public-readonly-chip"><Eye size={14} /> সবার জন্য · শুধু দেখা যাবে</span>
      </header>

      <div className="public-routine-shell">
        <div className="public-routine-tabs mobile-tab-scroll" role="group" aria-label="রুটিনের দিন বেছে নিন">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={selectedDay === id}
              onClick={() => setSelectedDay(id)}
              className={selectedDay === id ? "is-active" : ""}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="public-routine-grid" aria-label="রুটিন লোড হচ্ছে">
            {Array.from({ length: 4 }, (_, index) => <i key={index} className="public-routine-skeleton" />)}
          </div>
        ) : visibleRoutine.length === 0 ? (
          <div className="public-routine-empty">
            <CalendarDays size={27} />
            <strong>{dataUnavailable ? "লাইভ রুটিন এখন পাওয়া যাচ্ছে না" : "এই দিনের জন্য কোনো রুটিন প্রকাশিত হয়নি"}</strong>
            <span>{dataUnavailable ? "সংযোগ ফিরলে কেবল সংরক্ষিত রুটিনই এখানে দেখা যাবে।" : "অন্য দিন দেখতে উপরের ট্যাব ব্যবহার করুন।"}</span>
          </div>
        ) : (
          <div key={selectedDay} className="public-routine-grid public-tab-enter">
            {visibleRoutine.map((item) => {
              const isActive = selectedDay === "today" && item.id === activeItem?.id;
              const subject = subjectName(item);
              return (
                <article key={item.id} className={`public-routine-card${isActive ? " is-active" : ""}`}>
                  <time>{formatTimeRange(item.start_time, item.end_time)}</time>
                  {selectedDay === "all" && <span className="public-routine-day">{item.day}</span>}
                  <h3>{item.title}</h3>
                  <p>{item.category}{subject ? ` · ${subject}` : ""}</p>
                  {isActive && <b><Check size={12} /> এখন চলছে</b>}
                </article>
              );
            })}
          </div>
        )}

        <footer className="public-routine-footer">
          <span>{selectedDay === "today" ? `${clock.day} · আজকের রুটিন` : selectedDay === "all" ? "সকল প্রকাশিত দিন" : selectedDay}</span>
          <strong>{loading ? "লোড হচ্ছে" : dataUnavailable ? "তথ্য পাওয়া যাচ্ছে না" : `${visibleRoutine.length} টি রুটিন`}</strong>
        </footer>
      </div>
    </section>
  );
}
