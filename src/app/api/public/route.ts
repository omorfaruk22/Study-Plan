import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { defaultRoutine } from "@/lib/defaults";
import type { PublicStudyStats, StudyTrack } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emptyStudyStats: PublicStudyStats = {
  academic_minutes: 0,
  duet_department_minutes: 0,
  duet_non_department_minutes: 0,
};

const statKeys: Record<StudyTrack, keyof PublicStudyStats> = {
  academic: "academic_minutes",
  duet_department: "duet_department_minutes",
  duet_non_department: "duet_non_department_minutes",
};

function publicRoutine(doc: Record<string, unknown>) {
  const { _id, day, start_time, end_time, title, subject_id, subject_name, category, sort_order } = doc;
  return { id: String(_id), day, start_time, end_time, title, subject_id, subject_name, category, sort_order };
}

function publicSubject(doc: Record<string, unknown>) {
  const { _id, name, category, code, color } = doc;
  return { id: String(_id), name, category, code, color };
}

function getStudyTrack(log: Record<string, unknown>, subjectCategories: Map<string, string>): StudyTrack | null {
  if (log.study_track === "academic" || log.study_track === "duet_department" || log.study_track === "duet_non_department") {
    return log.study_track;
  }

  const category = subjectCategories.get(String(log.subject_id || ""));
  if (category === "DUET Department") return "duet_department";
  if (category === "DUET Non-Department") return "duet_non_department";
  if (category === "Academic" || category === "কলেজ" || category === "Web Development") return "academic";
  return null;
}

function summarizeStudy(logs: Record<string, unknown>[], subjects: Record<string, unknown>[]) {
  const subjectCategories = new Map<string, string>();
  for (const subject of subjects) {
    if (subject._id && subject.category) subjectCategories.set(String(subject._id), String(subject.category));
  }

  const studyStats = { ...emptyStudyStats };
  for (const log of logs) {
    const track = getStudyTrack(log, subjectCategories);
    if (!track) continue;
    studyStats[statKeys[track]] += Math.max(0, Number(log.actual_minutes) || 0);
  }
  return studyStats;
}

export async function GET() {
  try {
    const db = await getDb();
    const [routine, subjects, logs] = await Promise.all([
      db.collection("weekly_routine").find({}).sort({ sort_order: 1 }).toArray(),
      db.collection("subjects").find({}).sort({ category: 1, name: 1 }).toArray(),
      db.collection("study_logs").find({}, { projection: { study_track: 1, subject_id: 1, actual_minutes: 1 } }).toArray(),
    ]);

    return NextResponse.json({
      routine: routine.length ? routine.map(publicRoutine) : defaultRoutine.map((item, i) => ({ ...item, id: `sample-routine-${i}`, notes: null })),
      subjects: subjects.map(publicSubject),
      studyStats: summarizeStudy(logs, subjects),
    });
  } catch (error) {
    console.error("Public data unavailable:", error);
    return NextResponse.json({
      routine: defaultRoutine.map((item, i) => ({ ...item, id: `sample-routine-${i}`, notes: null })),
      subjects: [],
      studyStats: emptyStudyStats,
      demoMode: true,
    });
  }
}
