"use client";

import { useEffect, useState } from "react";
import type { PublicStudyStats, RoutineItem, Subject } from "@/lib/types";

type PublicStudyResponse = {
  routine?: RoutineItem[];
  subjects?: Subject[];
  studyStats?: PublicStudyStats;
  dataUnavailable?: boolean;
};

const emptyStudyStats: PublicStudyStats = {
  academic_minutes: 0,
  duet_department_minutes: 0,
  duet_non_department_minutes: 0,
  total_minutes: 0,
};

export function usePublicStudyData() {
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyStats, setStudyStats] = useState<PublicStudyStats>(emptyStudyStats);
  const [loading, setLoading] = useState(true);
  const [dataUnavailable, setDataUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPublicData() {
      try {
        const response = await fetch("/api/public", { cache: "no-store" });
        if (!response.ok) throw new Error("Public data unavailable");

        const data = (await response.json()) as PublicStudyResponse;
        if (!active) return;

        setRoutine(data.routine || []);
        setSubjects(data.subjects || []);
        setStudyStats(data.studyStats || emptyStudyStats);
        setDataUnavailable(Boolean(data.dataUnavailable));
      } catch {
        if (active) setDataUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPublicData();
    return () => {
      active = false;
    };
  }, []);

  return { routine, subjects, studyStats, loading, dataUnavailable };
}
