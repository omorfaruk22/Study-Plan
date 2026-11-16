"use client";

import { useEffect, useState } from "react";
import { CirclePlay, Pause, Play, Timer, Save } from "lucide-react";
import type { StudyLogInput, StudyTrack } from "@/lib/types";

const storageKey = "faruk-study-manager:active-study-stopwatch:v1";

type StopwatchSession = {
  entry: StudyLogInput;
  elapsedMs: number;
  startedAt: number | null;
};

type StudyStopwatchProps = {
  entry: StudyLogInput;
  canStart: boolean;
  busy: boolean;
  onFinish: (entry: StudyLogInput) => Promise<boolean>;
  onSessionChange: (track: StudyTrack | null) => void;
};

function parseSession(raw: string | null): StopwatchSession | null {
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

function elapsedAt(session: StopwatchSession, now: number) {
  return session.elapsedMs + (session.startedAt === null ? 0 : Math.max(0, now - session.startedAt));
}

function localDateAt(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatElapsed(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1_000);
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function trackLabel(track: StudyTrack) {
  if (track === "academic") return "Academic";
  return track === "duet_department" ? "DUET Department" : "DUET Non-Department";
}

export default function StudyStopwatch({ entry, canStart, busy, onFinish, onSessionChange }: StudyStopwatchProps) {
  const [session, setSession] = useState<StopwatchSession | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [now, setNow] = useState(0);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    let restored: StopwatchSession | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      restored = parseSession(raw);
      if (!restored && raw) window.localStorage.removeItem(storageKey);
    } catch {
      setStorageError("Browser storage পাওয়া যাচ্ছে না; timer এই পেজে চলবে, কিন্তু page বদলালে ধরে রাখা নাও যেতে পারে।");
    }
    setSession(restored);
    onSessionChange(restored?.entry.study_track || null);
    setNow(Date.now());
    setStorageReady(true);
  }, [onSessionChange]);

  useEffect(() => {
    if (!session || session.startedAt === null) return;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, [session]);

  useEffect(() => {
    function syncFromAnotherTab(event: StorageEvent) {
      if (event.key !== storageKey) return;
      const nextSession = parseSession(event.newValue);
      setSession(nextSession);
      onSessionChange(nextSession?.entry.study_track || null);
    }
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, [onSessionChange]);

  function persist(nextSession: StopwatchSession | null) {
    let stored = true;
    try {
      if (nextSession) window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
      else window.localStorage.removeItem(storageKey);
      setStorageError("");
    } catch {
      stored = false;
      setStorageError("Timer সংরক্ষণ করা যায়নি। Browser storage চালু আছে কি না দেখো।");
    }
    setSession(nextSession);
    onSessionChange(nextSession?.entry.study_track || null);
    return stored;
  }

  function startSession() {
    if (!canStart || session || !storageReady || busy || saving) return;
    const startedAt = Date.now();
    persist({ entry: { ...entry, study_date: localDateAt(startedAt) }, elapsedMs: 0, startedAt });
    setNow(startedAt);
  }

  function pauseSession() {
    if (!session || session.startedAt === null) return;
    const timestamp = Date.now();
    persist({ ...session, elapsedMs: elapsedAt(session, timestamp), startedAt: null });
    setNow(timestamp);
  }

  function resumeSession() {
    if (!session || session.startedAt !== null || busy || saving) return;
    const timestamp = Date.now();
    persist({ ...session, startedAt: timestamp });
    setNow(timestamp);
  }

  async function finishSession() {
    if (!session || busy || saving) return;
    const stopped = { ...session, elapsedMs: elapsedAt(session, Date.now()), startedAt: null };
    persist(stopped);
    setNow(Date.now());
    setSaving(true);
    try {
      const actualMinutes = Math.max(1, Math.round(stopped.elapsedMs / 60_000));
      const saved = await onFinish({
        ...stopped.entry,
        actual_minutes: actualMinutes,
        status: "সম্পন্ন",
      });
      if (saved) persist(null);
    } finally {
      setSaving(false);
    }
  }

  const elapsed = session ? elapsedAt(session, now || Date.now()) : 0;
  const isRunning = session !== null && session.startedAt !== null;
  const subjectLabel = session?.entry.subject_name?.trim() || "বিষয় লেখা হয়নি";

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-green-500/25 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent p-3.5 sm:p-4" aria-label="পড়ার stopwatch">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-500/15 text-green-500"><Timer size={20} /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-green-500">Study stopwatch</p>
            <p className="truncate text-xs text-slate-500">
              {session ? `${trackLabel(session.entry.study_track || "academic")} · ${subjectLabel} · ${session.entry.topic}` : "বিষয় ও কী পড়বে লিখে পড়া শুরু করো"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <time className="font-mono text-2xl font-black tabular-nums tracking-wider text-green-950 sm:text-3xl">{formatElapsed(elapsed)}</time>
          {!storageReady ? (
            <span className="text-xs text-slate-500">Timer খুঁজছি...</span>
          ) : !session ? (
            <button type="button" disabled={!canStart || busy} onClick={startSession} className="btn btn-primary px-3 py-2 text-xs disabled:opacity-50 sm:text-sm">
              <CirclePlay size={16} /> পড়া শুরু করো
            </button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              {isRunning ? (
                <button type="button" disabled={busy || saving} onClick={pauseSession} className="btn btn-plain px-3 py-2 text-xs">
                  <Pause size={15} /> বিরতি
                </button>
              ) : (
                <button type="button" disabled={busy || saving} onClick={resumeSession} className="btn btn-plain px-3 py-2 text-xs">
                  <Play size={15} /> আবার শুরু
                </button>
              )}
              <button type="button" disabled={busy || saving} onClick={() => void finishSession()} className="btn btn-primary px-3 py-2 text-xs disabled:opacity-50 sm:text-sm">
                <Save size={15} /> {saving ? "সংরক্ষণ হচ্ছে..." : "শেষ · সময়সহ সেভ"}
              </button>
            </div>
          )}
        </div>
      </div>
      {session && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-green-500/15 pt-2.5 text-[11px] text-slate-500">
          <span>{isRunning ? "টাইমার চলছে; page বদলালেও সময় চলবে।" : "টাইমার বিরতিতে আছে।"}</span>
          <span>সেভ হলে {Math.max(1, Math.round(elapsed / 60_000))} মিনিট লেখা হবে</span>
        </div>
      )}
      {storageError && <p role="alert" className="mt-2 text-xs font-semibold text-red-500">{storageError}</p>}
    </section>
  );
}
