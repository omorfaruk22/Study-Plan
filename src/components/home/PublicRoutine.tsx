"use client";

import { useMemo } from "react";
import { CalendarDays, Eye } from "lucide-react";
import type { RoutineItem, Subject } from "@/lib/types";

type PublicRoutineProps = {
  routine: RoutineItem[];
  subjects: Subject[];
  loading: boolean;
};

export default function PublicRoutine({ routine, subjects, loading }: PublicRoutineProps) {
  const groupedRoutine = useMemo(() => {
    const groups: Record<string, RoutineItem[]> = {};

    for (const item of routine) {
      (groups[item.day] ||= []).push(item);
    }

    for (const items of Object.values(groups)) {
      items.sort((first, second) => first.sort_order - second.sort_order);
    }

    return groups;
  }, [routine]);

  function subjectName(subjectId?: string | null) {
    return subjects.find((subject) => subject.id === subjectId)?.name;
  }

  return (
    <section id="routine" className="mt-12 scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-green-700">Weekly overview</p>
          <h2 className="mt-1 text-2xl font-extrabold text-green-950">সাপ্তাহিক রুটিন</h2>
          <p className="mt-1 text-sm text-slate-500">প্রকাশিত রুটিন সবাই দেখতে পারবে।</p>
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800">
          <Eye size={14} className="mr-1 inline" /> Visitor view · Read only
        </span>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-500">রুটিন লোড হচ্ছে...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(groupedRoutine).map(([day, items]) => (
            <article key={day} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-green-100 bg-green-50/70 px-5 py-4">
                <h3 className="font-bold text-green-950">{day}</h3>
                <CalendarDays size={17} className="text-green-700" />
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 px-5 py-4">
                    <div className="w-[108px] shrink-0">
                      <p className="text-xs font-bold text-green-800">{item.start_time}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{item.end_time}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.notes || item.subject_name || subjectName(item.subject_id) || item.category}
                      </p>
                      <span className="mt-2 inline-block rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
