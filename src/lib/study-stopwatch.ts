import type { StudyLogInput } from "@/lib/types";

export const studyStopwatchStorageKey = "faruk-study-manager:active-study-stopwatch:v1";
export const studyStopwatchSyncEvent = "faruk-study-manager:study-stopwatch-session";

export type StopwatchSession = {
  entry: StudyLogInput;
  elapsedMs: number;
  startedAt: number | null;
};

export function parseStopwatchSession(raw: string | null): StopwatchSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StopwatchSession>;
    const entry = value.entry as Partial<StudyLogInput> | undefined;
    const validTrack = entry?.study_track === "academic" || entry?.study_track === "duet_department" || entry?.study_track === "duet_non_department";
    if (
      !entry || !validTrack || typeof entry.topic !== "string" ||
      typeof value.elapsedMs !== "number" || !Number.isFinite(value.elapsedMs) || value.elapsedMs < 0 ||
      (value.startedAt !== null && typeof value.startedAt !== "number")
    ) return null;
    return value as StopwatchSession;
  } catch {
    return null;
  }
}

export function elapsedAt(session: StopwatchSession, now: number) {
  return session.elapsedMs + (session.startedAt === null ? 0 : Math.max(0, now - session.startedAt));
}

export function publishStopwatchSession(session: StopwatchSession | null) {
  window.dispatchEvent(new CustomEvent<StopwatchSession | null>(studyStopwatchSyncEvent, { detail: session }));
}
