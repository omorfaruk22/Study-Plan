import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { resolveStudyTrack } from "@/lib/study-track";
import type { PublicStudyStats, StudyTrack } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emptyStudyStats: PublicStudyStats = {
  academic_minutes: 0,
  duet_department_minutes: 0,
  duet_non_department_minutes: 0,
  total_minutes: 0,
};

const statKeys: Record<StudyTrack, keyof PublicStudyStats> = {
  academic: "academic_minutes",
  duet_department: "duet_department_minutes",
  duet_non_department: "duet_non_department_minutes",
};

function publicRoutine(doc: Record<string, unknown>) {
  const { _id, day, start_time, end_time, title, subject_id, subject_name, category, sort_order } = doc;
  // Notes can contain private details such as a room, teacher, or personal reminder.
  // The public endpoint intentionally publishes schedule fields only.
  return { id: String(_id), day, start_time, end_time, title, subject_id, subject_name, category, sort_order };
}

function publicSubject(doc: Record<string, unknown>) {
  const { _id, name, category, code, color } = doc;
  return { id: String(_id), name, category, code, color };
}

function summarizeStudy(logs: Record<string, unknown>[], subjects: Record<string, unknown>[]) {
  const studyStats = { ...emptyStudyStats };
  for (const log of logs) {
    const minutes = Math.max(0, Number(log.actual_minutes) || 0);
    studyStats.total_minutes += minutes;

    // Older records can keep only their linked subject/category. Resolve that
    // relationship at read time so their real saved minutes stay visible.
    const track = resolveStudyTrack(log, subjects);
    if (track) studyStats[statKeys[track]] += minutes;
  }
  return studyStats;
}

export async function GET() {
  try {
    const db = await getDb();
    const [routine, subjects, logs] = await Promise.all([
      db.collection("weekly_routine").find({}).sort({ sort_order: 1 }).toArray(),
      db.collection("subjects").find({}).sort({ category: 1, name: 1 }).toArray(),
      db.collection("study_logs").find({}, {
        projection: {
          study_track: 1,
          studyTrack: 1,
          track: 1,
          category: 1,
          study_category: 1,
          subject_category: 1,
          subject_id: 1,
          subject_name: 1,
          actual_minutes: 1,
        },
      }).toArray(),
    ]);

    return NextResponse.json({
      routine: routine.map(publicRoutine),
      subjects: subjects.map(publicSubject),
      studyStats: summarizeStudy(logs, subjects),
    });
  } catch (error) {
    console.error("Public data unavailable:", error);
    return NextResponse.json({
      routine: [],
      subjects: [],
      studyStats: emptyStudyStats,
      dataUnavailable: true,
    });
  }
}
