import { getDhakaDateKey } from "@/lib/routine-time";
import type { Subject } from "@/lib/types";

export function formatMinutes(minutes: number) {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;

  if (hours === 0) return `${remainder} মিনিট`;
  if (remainder === 0) return `${hours} ঘণ্টা`;
  return `${hours} ঘণ্টা ${remainder} মিনিট`;
}

export function subjectLabel(subjects: Subject[], subjectId?: string | null, customName?: string | null) {
  return customName?.trim() || subjects.find((subject) => subject.id === subjectId)?.name || "বিষয় উল্লেখ নেই";
}

export function localDateKey(date: Date) {
  return getDhakaDateKey(date);
}
