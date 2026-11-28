"use client";

import { useEffect, useState } from "react";
import { defaultRoutine } from "@/lib/defaults";
import type { PublicStudyStats, RoutineItem, Subject } from "@/lib/types";

type PublicStudyResponse = {
  routine?: RoutineItem[];
  subjects?: Subject[];
  studyStats?: PublicStudyStats;
  demoMode?: boolean;
};

const emptyStudyStats: PublicStudyStats = {
  academic_minutes: 0,
  duet_department_minutes: 0,
  duet_non_department_minutes: 0,
};

const sampleRoutine = defaultRoutine.map(({ notes: _notes, ...item }, index) => ({
  ...item,
  id: `sample-routine-${index}`,
})) as RoutineItem[];

export function usePublicStudyData() {
  const [routine, setRoutine] = useState<RoutineItem[]>(sampleRoutine);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyStats, setStudyStats] = useState<PublicStudyStats>(emptyStudyStats);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPublicData() {
      try {
        const response = await fetch("/api/public", { cache: "no-store" });
        if (!response.ok) throw new Error("Public data unavailable");

        const data = (await response.json()) as PublicStudyResponse;
        if (!active) return;

        setRoutine(data.routine || sampleRoutine);
        setSubjects(data.subjects || []);
        setStudyStats(data.studyStats || emptyStudyStats);
        setDemoMode(Boolean(data.demoMode));
      } catch {
        if (active) setDemoMode(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPublicData();
    return () => {
      active = false;
    };
  }, []);

  return { routine, subjects, studyStats, loading, demoMode };
}
