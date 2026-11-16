"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Target } from "lucide-react";
import type { StudyGoals, StudyLog, StudyTrack } from "@/lib/types";
import { requestApi } from "@/lib/owner-api";
import { localDateKey } from "@/components/manage/analytics/chart-utils";
import useResponsiveDisclosure from "@/components/manage/useResponsiveDisclosure";

const defaults: StudyGoals = { academic_minutes: 0, duet_department_minutes: 0, duet_non_department_minutes: 0 };
const tracks: { key: keyof StudyGoals; id: StudyTrack; label: string; tone: string }[] = [
  { key: "academic_minutes", id: "academic", label: "Academic", tone: "from-emerald-700 to-green-500" },
  { key: "duet_department_minutes", id: "duet_department", label: "DUET Department", tone: "from-green-700 to-lime-500" },
  { key: "duet_non_department_minutes", id: "duet_non_department", label: "DUET Non-Department", tone: "from-teal-700 to-emerald-400" },
];

function toHours(minutes: number) {
  return minutes > 0 ? String(minutes / 60) : "";
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours} ঘণ্টা${remainder ? ` ${remainder} মিনিট` : ""}` : `${remainder} মিনিট`;
}

export default function DailyGoalsPanel({ logs }: { logs: StudyLog[] }) {
  const [open, setOpen] = useResponsiveDisclosure();
  const [goals, setGoals] = useState<StudyGoals>(defaults);
  const [hours, setHours] = useState<Record<keyof StudyGoals, string>>({ academic_minutes: "", duet_department_minutes: "", duet_non_department_minutes: "" });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadGoals() {
      try {
        const response = await requestApi<{ goals: StudyGoals }>("/api/owner/goals");
        if (!active) return;
        setGoals(response.goals);
        setHours({
          academic_minutes: toHours(response.goals.academic_minutes),
          duet_department_minutes: toHours(response.goals.duet_department_minutes),
          duet_non_department_minutes: toHours(response.goals.duet_non_department_minutes),
        });
        setError("");
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "লক্ষ্য লোড করা যায়নি।");
      } finally {
        if (active) setReady(true);
      }
    }
    const refreshGoals = () => { void loadGoals(); };
    void loadGoals();
    window.addEventListener("faruk-study-manager:refresh-goals", refreshGoals);
    return () => {
      active = false;
      window.removeEventListener("faruk-study-manager:refresh-goals", refreshGoals);
    };
  }, []);

  const today = localDateKey(new Date());
  const totals: Record<StudyTrack, number> = { academic: 0, duet_department: 0, duet_non_department: 0 };
  for (const log of logs) {
    if (log.study_date === today && log.study_track && log.study_track in totals) {
      totals[log.study_track] += Math.max(0, Number(log.actual_minutes) || 0);
    }
  }

  function changeHours(key: keyof StudyGoals, value: string) {
    setHours((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function saveGoals() {
    setSaving(true);
    setError("");
    setMessage("");
    const nextGoals = Object.fromEntries(Object.keys(defaults).map((key) => {
      const typed = Number(hours[key as keyof StudyGoals]);
      return [key, Number.isFinite(typed) ? Math.max(0, Math.min(1440, Math.round(typed * 60))) : 0];
    })) as StudyGoals;
    try {
      const response = await requestApi<{ goals: StudyGoals }>("/api/owner/goals", "PUT", { goals: nextGoals });
      setGoals(response.goals);
      setHours({
        academic_minutes: toHours(response.goals.academic_minutes),
        duet_department_minutes: toHours(response.goals.duet_department_minutes),
        duet_non_department_minutes: toHours(response.goals.duet_non_department_minutes),
      });
      setMessage("দৈনিক লক্ষ্য সেভ হয়েছে।");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "লক্ষ্য সেভ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="mobile-disclosure card mt-3 overflow-hidden p-3.5 sm:mt-4 sm:p-5">
      <summary className="sm:hidden">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-green-700"><Target size={14} /> Daily focus · 3 track</span>
          <span className="mt-1 block text-sm font-black text-green-950">আজকের লক্ষ্য ও অগ্রগতি</span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-green-600 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mobile-disclosure-content">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.14em] text-green-700"><Target size={15} /> Daily focus</p>
          <h2 className="mt-1 text-lg font-black text-green-950">আজকের লক্ষ্য ও অগ্রগতি</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">প্রতি track-এর লক্ষ্য ঘণ্টায় সেট করো; পড়ার সময় stopwatch থেকে যোগ হবে।</p>
        </div>
        <button type="button" disabled={!ready || saving} onClick={() => void saveGoals()} className="btn btn-primary px-3 py-2 text-xs disabled:opacity-50">
          <Check size={15} /> {saving ? "সেভ হচ্ছে…" : "লক্ষ্য সেভ"}
        </button>
      </div>

      <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3 md:grid-cols-3">
        {tracks.map((track) => {
          const actual = totals[track.id];
          const goal = goals[track.key];
          const progress = goal > 0 ? Math.min(100, actual / goal * 100) : 0;
          return (
            <article key={track.key} className="rounded-2xl border border-green-100 bg-green-50/50 p-3 sm:p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-green-950">{track.label}</p>
                <p className="whitespace-nowrap text-[11px] font-bold text-slate-500">{durationLabel(actual)}{goal > 0 ? ` / ${durationLabel(goal)}` : " · লক্ষ্য নেই"}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-100">
                <div className={`h-full rounded-full bg-gradient-to-r ${track.tone} transition-[width] duration-500`} style={{ width: `${progress}%` }} />
              </div>
              <label className="mt-3 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500">
                দৈনিক লক্ষ্য
                <span className="flex items-center gap-1.5">
                  <input type="number" min="0" max="24" step="0.25" className="field w-24 py-1.5 text-right text-sm" value={hours[track.key]} onChange={(event) => changeHours(track.key, event.target.value)} placeholder="০" disabled={!ready || saving} />
                  ঘণ্টা
                </span>
              </label>
            </article>
          );
        })}
      </div>
      {message && <p role="status" className="mt-3 text-xs font-semibold text-green-700">{message}</p>}
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
      </div>
    </details>
  );
}
