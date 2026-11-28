"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock3, GraduationCap } from "lucide-react";
import type { RoutineItem } from "@/lib/types";
import { formatTimeRange, getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, WEEKDAYS } from "@/lib/routine-time";

type TodayClassRoutineProps = {
  routine: RoutineItem[];
  loading: boolean;
  dataUnavailable: boolean;
};

function isClassInProgress(item: RoutineItem, currentMinutes: number) {
  const start = routineTimeToMinutes(item.start_time);
  const end = routineTimeToMinutes(item.end_time);
  if (start === null || end === null || start === end) return false;
  return start < end
    ? currentMinutes >= start && currentMinutes < end
    : currentMinutes >= start || currentMinutes < end;
}

function sortRoutineItems(first: RoutineItem, second: RoutineItem) {
  const firstStart = routineTimeToMinutes(first.start_time);
  const secondStart = routineTimeToMinutes(second.start_time);
  if (firstStart !== null && secondStart !== null) return firstStart - secondStart;
  if (firstStart !== null) return -1;
  if (secondStart !== null) return 1;
  return (Number(first.sort_order) || 0) - (Number(second.sort_order) || 0);
}

export default function TodayClassRoutine({ routine, loading, dataUnavailable }: TodayClassRoutineProps) {
  const [today, setToday] = useState(() => getDhakaRoutineClock());
  const [dayOffset, setDayOffset] = useState(0);

  const todayIndex = WEEKDAYS.indexOf(today.day);
  const selectedDay = WEEKDAYS[(todayIndex + dayOffset) % WEEKDAYS.length];

  useEffect(() => {
    const updateDay = () => setToday(getDhakaRoutineClock());
    updateDay();
    const intervalId = window.setInterval(updateDay, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setDayOffset(0);
  }, [today.day]);

  const classes = useMemo(() => routine
    .filter((item) => item.category === "ক্লাস রুটিন" && routineMatchesDay(item.day, selectedDay))
    .sort(sortRoutineItems), [routine, selectedDay]);

  return (
    <section aria-label={`${selectedDay} এর ক্লাস রুটিন`} className="public-class-panel">
      <header className="public-class-heading">
        <div>
          <p><GraduationCap size={17} /> Live class routine</p>
          <h2>{dayOffset === 0 ? "আজকের ক্লাস" : "ক্লাস রুটিন"}</h2>
          <span>{selectedDay}</span>
        </div>
        <button
          type="button"
          aria-label={`${WEEKDAYS[(WEEKDAYS.indexOf(selectedDay) + 1) % WEEKDAYS.length]} এর ক্লাস দেখুন`}
          title="পরের দিনের ক্লাস দেখুন"
          onClick={() => setDayOffset((offset) => (offset + 1) % WEEKDAYS.length)}
          className="public-day-step"
        >
          <ChevronRight size={19} />
        </button>
      </header>

      {loading ? (
        <div className="public-class-loading" aria-label="ক্লাস রুটিন লোড হচ্ছে"><i /><i /><i /></div>
      ) : classes.length === 0 ? (
        <div className="public-class-empty">
          <Clock3 size={21} />
          <p>{dataUnavailable ? "লাইভ ক্লাসের তথ্য পাওয়া যাচ্ছে না।" : dayOffset === 0 ? "আজ কোনো ক্লাস নেই।" : `${selectedDay} কোনো ক্লাস নেই।`}</p>
        </div>
      ) : (
        <div key={selectedDay} className="public-class-grid public-tab-enter">
          {classes.map((item) => {
            const isActive = dayOffset === 0 && isClassInProgress(item, today.minutes);
            return (
              <article key={item.id} aria-current={isActive ? "true" : undefined} className={`public-class-card${isActive ? " is-active" : ""}`}>
                <time><Clock3 size={13} /> {formatTimeRange(item.start_time, item.end_time)}</time>
                <h3>{item.title}</h3>
                <p>{item.subject_name || item.category}</p>
                {isActive && <span>এখন চলছে</span>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
