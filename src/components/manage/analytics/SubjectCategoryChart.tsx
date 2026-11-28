import type { StudyTrack, Subject } from "@/lib/types";
import ChartCard from "@/components/manage/analytics/ChartCard";
import { getSubjectStudyTrack } from "@/lib/study-track";

const sections: { track: StudyTrack; label: string }[] = [
  { track: "academic", label: "একাডেমিক" },
  { track: "duet_department", label: "DUET Department" },
  { track: "duet_non_department", label: "DUET Non-Department" },
];

export default function SubjectCategoryChart({ subjects }: { subjects: Subject[] }) {
  const totals = sections.map((section) => ({
    ...section,
    count: subjects.filter((subject) => getSubjectStudyTrack(subject) === section.track).length,
  }));
  const maxCount = Math.max(...totals.map((item) => item.count), 1);

  return (
    <ChartCard title="বিভাগ অনুযায়ী বিষয়" description="প্রতিটি পেজে তোমার যোগ করা subject-এর আসল সংখ্যা।">
      <div className="space-y-3">
        {totals.map((item) => (
          <div key={item.track}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 break-words font-semibold text-slate-700">{item.label}</span>
              <span className="shrink-0 font-bold text-slate-500">{item.count}টি</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-green-50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-lime-500 transition-[width] duration-500"
                style={{ width: item.count ? `${Math.max((item.count / maxCount) * 100, 4)}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>
      {subjects.length === 0 && <p className="mt-3 text-center text-xs text-slate-400">Subject যোগ করলে এখানে সংখ্যা আপডেট হবে।</p>}
    </ChartCard>
  );
}
