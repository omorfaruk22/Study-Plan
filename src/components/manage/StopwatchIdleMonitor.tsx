"use client";

import { useEffect, useRef, useState } from "react";
import { PauseCircle } from "lucide-react";
import {
  elapsedAt,
  parseStopwatchSession,
  publishStopwatchSession,
  studyStopwatchStorageKey,
  studyStopwatchSyncEvent,
  type StopwatchSession,
} from "@/lib/study-stopwatch";

export default function StopwatchIdleMonitor() {
  const [session, setSession] = useState<StopwatchSession | null>(null);
  const [warning, setWarning] = useState(false);
  const [error, setError] = useState("");
  const lastActivityAt = useRef(Date.now());

  useEffect(() => {
    function readSession() {
      try {
        setSession(parseStopwatchSession(window.localStorage.getItem(studyStopwatchStorageKey)));
      } catch {
        setSession(null);
      }
    }
    function syncFromSameTab(event: Event) {
      setSession((event as CustomEvent<StopwatchSession | null>).detail);
    }
    readSession();
    window.addEventListener("storage", readSession);
    window.addEventListener(studyStopwatchSyncEvent, syncFromSameTab);
    return () => {
      window.removeEventListener("storage", readSession);
      window.removeEventListener(studyStopwatchSyncEvent, syncFromSameTab);
    };
  }, []);

  useEffect(() => {
    if (!session || session.startedAt === null) {
      setWarning(false);
      return;
    }
    const idleLimit = 15 * 60 * 1_000;
    lastActivityAt.current = Date.now();
    setWarning(false);
    const checkIdle = () => {
      if (!document.hidden && Date.now() - lastActivityAt.current >= idleLimit) setWarning(true);
    };
    const registerActivity = () => {
      if (Date.now() - lastActivityAt.current >= idleLimit) setWarning(true);
      else lastActivityAt.current = Date.now();
    };
    window.addEventListener("pointerdown", registerActivity, { passive: true });
    window.addEventListener("keydown", registerActivity);
    window.addEventListener("touchstart", registerActivity, { passive: true });
    window.addEventListener("scroll", registerActivity, { passive: true });
    document.addEventListener("visibilitychange", checkIdle);
    const intervalId = window.setInterval(checkIdle, 15_000);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("pointerdown", registerActivity);
      window.removeEventListener("keydown", registerActivity);
      window.removeEventListener("touchstart", registerActivity);
      window.removeEventListener("scroll", registerActivity);
      document.removeEventListener("visibilitychange", checkIdle);
    };
  }, [session?.startedAt]);

  function continueStudying() {
    lastActivityAt.current = Date.now();
    setWarning(false);
  }

  function pauseAndExcludeIdle() {
    if (!session || session.startedAt === null) return;
    const timestamp = Math.max(session.startedAt, Math.min(Date.now(), lastActivityAt.current));
    const paused = { ...session, elapsedMs: elapsedAt(session, timestamp), startedAt: null };
    try {
      window.localStorage.setItem(studyStopwatchStorageKey, JSON.stringify(paused));
      setError("");
      setSession(paused);
      publishStopwatchSession(paused);
      setWarning(false);
    } catch {
      setError("Timer pause করা যায়নি; stopwatch-এর pause button ব্যবহার করো।");
    }
  }

  if (!warning || !session || session.startedAt === null) return null;

  return (
    <aside role="alert" className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-800 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5">
      <div className="flex items-start gap-3">
        <PauseCircle size={20} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold">১৫ মিনিট ধরে কোনো activity নেই</p>
          <p className="mt-1 text-xs leading-5">বিরতি নিয়ে থাকলে idle সময় বাদ দাও; পড়তে থাকলে timer চালু রাখো।</p>
          {error && <p className="mt-2 text-xs font-bold text-red-700">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={continueStudying} className="btn btn-primary px-3 py-2 text-xs">আমি পড়ছি · চালু রাখো</button>
            <button type="button" onClick={pauseAndExcludeIdle} className="btn btn-plain px-3 py-2 text-xs">বিরতি ছিল · সময় বাদ দাও</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
