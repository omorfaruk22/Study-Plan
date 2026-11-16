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
    { label: "একাডেমিক", minutes: stats.academic_minutes, icon: BookOpen, color: "bg-green-100 text-green-800" },
    { label: "DUET Department", minutes: stats.duet_department_minutes, icon: GraduationCap, color: "bg-lime-100 text-lime-800" },
    { label: "DUET Non-Department", minutes: stats.duet_non_department_minutes, icon: LibraryBig, color: "bg-emerald-100 text-emerald-800" },
  ];

  return (
    <aside aria-label="সর্বজনীন পড়ার পরিসংখ্যান" className="card flex flex-col p-5 sm:p-6">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-green-700">Public study stats</p>
        <h2 className="mt-1 text-lg font-black text-green-950">মোট পড়ার সময়</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">সবাই এখান থেকে পড়ার অগ্রগতি দেখতে পারবে।</p>
      </div>
      <div className="mt-4 grid gap-2 min-[440px]:grid-cols-3 lg:grid-cols-1">
        {items.map(({ label, minutes, icon: Icon, color }) => (
          <article key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-green-50 bg-green-50/50 p-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${color}`}><Icon size={17} /></span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-slate-500">{label}</p>
              <p className="text-sm font-extrabold text-green-950">{loading ? "লোড হচ্ছে…" : formatDuration(minutes)}</p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
