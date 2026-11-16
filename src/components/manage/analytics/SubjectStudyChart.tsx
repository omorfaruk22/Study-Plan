import type { StudyLog, Subject } from "@/lib/types";
import ChartCard from "@/components/manage/analytics/ChartCard";
import { formatMinutes, subjectLabel } from "@/components/manage/analytics/chart-utils";

type SubjectTotal = {
  name: string;
  minutes: number;
  sessions: number;
};

function getSubjectTotals(logs: StudyLog[], subjects: Subject[]): SubjectTotal[] {
  const totals = new Map<string, SubjectTotal>();

  for (const log of logs) {
    const name = subjectLabel(subjects, log.subject_id, log.subject_name);
    const current = totals.get(name) || { name, minutes: 0, sessions: 0 };
    current.minutes += Number(log.actual_minutes) || 0;
    current.sessions += 1;
    totals.set(name, current);
  }

  return [...totals.values()].sort((first, second) => second.minutes - first.minutes || first.name.localeCompare(second.name));
}

export default function SubjectStudyChart({ logs, subjects }: { logs: StudyLog[]; subjects: Subject[] }) {
  const totals = getSubjectTotals(logs, subjects);
  const maxMinutes = Math.max(...totals.map((item) => item.minutes), 1);

  return (
    <ChartCard title="বিষয়ভিত্তিক পড়া" description="পড়ার সময় ও সেশনের সংখ্যা অনুযায়ী সব বিষয়।">
      {totals.length === 0 ? (
        <p className="rounded-xl bg-green-50 px-3 py-5 text-center text-sm text-green-800">এখনও কোনো পড়ার লগ নেই।</p>
      ) : (
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {totals.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-start justify-between gap-3 text-xs">
                <span className="min-w-0 break-words font-semibold text-slate-700">{item.name}</span>
                <span className="shrink-0 text-right text-slate-500">{formatMinutes(item.minutes)} · {item.sessions} সেশন</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-green-50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-700 to-lime-500"
                  style={{ width: `${Math.max((item.minutes / maxMinutes) * 100, item.minutes > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
