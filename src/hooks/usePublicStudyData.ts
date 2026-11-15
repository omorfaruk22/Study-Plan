"use client";

import { useEffect, useState } from "react";
import { defaultRoutine, defaultSubjects } from "@/lib/defaults";
import type { RoutineItem, Subject } from "@/lib/types";

type PublicStudyResponse = {
  routine?: RoutineItem[];
  subjects?: Subject[];
  demoMode?: boolean;
};

const sampleRoutine = defaultRoutine.map((item, index) => ({
  ...item,
  id: `sample-routine-${index}`,
})) as RoutineItem[];

const sampleSubjects = defaultSubjects.map((item, index) => ({
  ...item,
  id: `sample-subject-${index}`,
})) as Subject[];

export function usePublicStudyData() {
  const [routine, setRoutine] = useState<RoutineItem[]>(sampleRoutine);
  const [subjects, setSubjects] = useState<Subject[]>(sampleSubjects);
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
        setSubjects(data.subjects || sampleSubjects);
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

  return { routine, subjects, loading, demoMode };
}
