"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock3, Sparkles } from "lucide-react";
import type { RoutineItem, Subject } from "@/lib/types";
import { formatTimeRange, getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, type DhakaRoutineClock } from "@/lib/routine-time";

type StudyFocusCardsProps = {
  routine: RoutineItem[];
  subjects: Subject[];
  loading: boolean;
  dataUnavailable: boolean;
};

function sortRoutineItems(first: RoutineItem, second: RoutineItem) {
  const firstStart = routineTimeToMinutes(first.start_time);
  const secondStart = routineTimeToMinutes(second.start_time);
  if (firstStart !== null && secondStart !== null) return firstStart - secondStart;
  if (firstStart !== null) return -1;
  if (secondStart !== null) return 1;
  return (Number(first.sort_order) || 0) - (Number(second.sort_order) || 0);
}

export default function StudyFocusCards({ routine, subjects, loading, dataUnavailable }: StudyFocusCardsProps) {
  const [clock, setClock] = useState<DhakaRoutineClock | null>(null);

  useEffect(() => {
    const update = () => setClock(getDhakaRoutineClock());
    update();
    const intervalId = window.setInterval(update, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const todayItems = useMemo(() => {
    if (!clock) return [];
    return routine
      .filter((item) => routineMatchesDay(item.day, clock.day))
      .sort(sortRoutineItems)
      .slice(0, 3);
  }, [clock, routine]);

  function subjectName(item: RoutineItem) {
    return item.subject_name?.trim() || subjects.find((subject) => subject.id === item.subject_id)?.name || "";
  }

  return (
    <section aria-labelledby="live-focus-title" className="public-focus-section">
      <header className="public-section-heading">
        <div>
          <p><Sparkles size={15} /> Live focus</p>
          <h2 id="live-focus-title">আজকের পড়ার ফোকাস</h2>
          <span>{clock ? `${clock.day} · Dhaka time অনুযায়ী` : "সময় যাচাই হচ্ছে..."}</span>
        </div>
        <span className="public-focus-count"><CalendarClock size={15} /> {loading ? "লোড হচ্ছে" : dataUnavailable ? "তথ্য পাওয়া যাচ্ছে না" : `${todayItems.length}টি রুটিন`}</span>
      </header>

      {loading ? (
        <div className="public-focus-grid" aria-label="Live routine loading">
          {Array.from({ length: 3 }, (_, index) => <i key={index} className="public-focus-skeleton" />)}
        </div>
      ) : todayItems.length > 0 ? (
        <div className="public-focus-grid public-tab-enter">
          {todayItems.map((item, index) => {
            const subject = subjectName(item);
            return (
              <article key={item.id} className={`public-focus-card tone-${index % 3}`}>
                <span className="public-focus-icon"><Clock3 size={20} /></span>
                <div>
                  <time>{formatTimeRange(item.start_time, item.end_time)}</time>
                  <h3>{item.title}</h3>
                  <p>{item.category}{subject ? ` · ${subject}` : ""}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="public-live-empty">
          <CalendarClock size={24} />
          <div><strong>{dataUnavailable ? "লাইভ রুটিন পাওয়া যাচ্ছে না" : "আজকের জন্য কোনো রুটিন নেই"}</strong><span>{dataUnavailable ? "সংযোগ ফিরলে এখানে শুধু সংরক্ষিত রুটিনই দেখা যাবে।" : "অন্য দিনের সময়সূচি দেখতে নিচের সাপ্তাহিক রুটিন ব্যবহার করুন।"}</span></div>
        </div>
      )}
    </section>
  );
}
