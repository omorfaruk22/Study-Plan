"use client";

import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, Clock3, GraduationCap, LibraryBig, type LucideIcon } from "lucide-react";
import type { PublicStudyStats as StudyStats } from "@/lib/types";

type PublicStudyStatsProps = {
  stats: StudyStats;
  subjectCount: number;
  routineCount: number;
  loading: boolean;
  dataUnavailable: boolean;
};

type MetricType = "count" | "minutes";

type Metric = {
  label: string;
  detail: string;
  value: number;
  type: MetricType;
  icon: LucideIcon;
  tone: string;
};

function formatDuration(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0) return `${hours}h${remainder ? ` ${remainder}m` : ""}`;
  return `${remainder}m`;
}

function useAnimatedValue(target: number, enabled: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    const safeTarget = Math.max(0, Math.round(target));
    const startedAt = performance.now();
    const duration = Math.min(1_000, 380 + Math.sqrt(safeTarget + 1) * 45);
    let frameId = 0;
    const update = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(safeTarget * eased));
      if (progress < 1) frameId = window.requestAnimationFrame(update);
    };

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [enabled, target]);

  return value;
}

function AnimatedMetricValue({ value, type, loading, dataUnavailable }: { value: number; type: MetricType; loading: boolean; dataUnavailable: boolean }) {
  const animatedValue = useAnimatedValue(value, !loading && !dataUnavailable);
  if (loading) return <span className="public-metric-skeleton" aria-label="Loading live data" />;
  if (dataUnavailable) return <>—</>;
  return <>{type === "minutes" ? formatDuration(animatedValue) : animatedValue.toLocaleString("en-US")}</>;
}

export default function PublicStudyStats({ stats, subjectCount, routineCount, loading, dataUnavailable }: PublicStudyStatsProps) {
  const duetMinutes = stats.duet_department_minutes + stats.duet_non_department_minutes;
  // total_minutes is deliberately maintained by the API for every persisted
  // log, including old records that do not yet have a track field.
  const totalMinutes = Number.isFinite(stats.total_minutes)
    ? Math.max(0, stats.total_minutes)
    : stats.academic_minutes + duetMinutes;
  const items: Metric[] = [
    { label: "বিষয় সমূহ", detail: "প্রকাশিত বিষয়", value: subjectCount, type: "count", icon: BookOpen, tone: "subjects" },
    { label: "সাপ্তাহিক রুটিন", detail: "লাইভ সময়সূচি", value: routineCount, type: "count", icon: CalendarDays, tone: "routine" },
    { label: "একাডেমিক পড়া", detail: "সেভ করা সময়", value: stats.academic_minutes, type: "minutes", icon: LibraryBig, tone: "academic" },
    { label: "DUET পড়া", detail: "Department + Non-Department", value: duetMinutes, type: "minutes", icon: GraduationCap, tone: "duet" },
    { label: "মোট পড়ার সময়", detail: "সব সেভ করা session", value: totalMinutes, type: "minutes", icon: Clock3, tone: "time" },
  ];

  return (
    <section aria-label="লাইভ পড়াশোনার সারসংক্ষেপ" className="public-metric-grid">
      {items.map(({ label, detail, value, type, icon: Icon, tone }) => (
        <article key={label} className={`public-metric-card tone-${tone}`}>
          <span className="public-metric-icon"><Icon size={23} /></span>
          <div>
            <strong><AnimatedMetricValue value={value} type={type} loading={loading} dataUnavailable={dataUnavailable} /></strong>
            <p>{label}</p>
            <small>{dataUnavailable ? "Live data unavailable" : detail}</small>
          </div>
          <i aria-hidden="true" />
        </article>
      ))}
    </section>
  );
}
