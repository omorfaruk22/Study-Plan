import { BookOpen, GraduationCap, LibraryBig } from "lucide-react";
import type { PublicStudyStats as StudyStats } from "@/lib/types";

type PublicStudyStatsProps = {
  stats: StudyStats;
  loading: boolean;
};

function formatDuration(totalMinutes: number) {
  return `${(Math.max(0, totalMinutes) / 60).toFixed(1)} ঘণ্টা`;
}

export default function PublicStudyStats({ stats, loading }: PublicStudyStatsProps) {
  const items = [
    { label: "একাডেমিক", shortLabel: "একাডেমিক", minutes: stats.academic_minutes, icon: BookOpen, color: "bg-green-100 text-green-800" },
    { label: "DUET Department", shortLabel: "DUET Dept.", minutes: stats.duet_department_minutes, icon: GraduationCap, color: "bg-lime-100 text-lime-800" },
    { label: "DUET Non-Department", shortLabel: "DUET Non-Dept.", minutes: stats.duet_non_department_minutes, icon: LibraryBig, color: "bg-emerald-100 text-emerald-800" },
  ];

  return (
    <aside aria-label="সর্বজনীন পড়ার পরিসংখ্যান" className="card flex flex-col p-3.5 sm:p-5 lg:p-6">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-green-700">Public study stats</p>
        <h2 className="mt-1 text-lg font-black text-green-950">মোট পড়ার সময়</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">সবাই এখান থেকে পড়ার অগ্রগতি দেখতে পারবে।</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 lg:grid-cols-1">
        {items.map(({ label, shortLabel, minutes, icon: Icon, color }) => (
          <article key={label} className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-green-50 bg-green-50/50 p-2 text-center min-[440px]:flex-row min-[440px]:gap-3 min-[440px]:p-3 min-[440px]:text-left lg:flex-row">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 ${color}`}><Icon size={16} /></span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                <span className="min-[440px]:hidden">{shortLabel}</span><span className="hidden min-[440px]:inline">{label}</span>
              </p>
              <p className="text-xs font-extrabold text-green-950 sm:text-sm">{loading ? "লোড হচ্ছে…" : formatDuration(minutes)}</p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
