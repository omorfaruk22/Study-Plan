import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { defaultRoutine, defaultSubjects } from "@/lib/defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicRoutine(doc: Record<string, unknown>) {
  const { _id, day, start_time, end_time, title, subject_id, subject_name, category, sort_order } = doc;
  return { id: String(_id), day, start_time, end_time, title, subject_id, subject_name, category, sort_order };
}
function publicSubject(doc: Record<string, unknown>) {
  const { _id, name, category, code, color } = doc;
  return { id: String(_id), name, category, code, color };
}

export async function GET() {
  try {
    const db = await getDb();
    const [routine, subjects] = await Promise.all([
      db.collection("weekly_routine").find({}).sort({ sort_order: 1 }).toArray(),
      db.collection("subjects").find({}).sort({ category: 1, name: 1 }).toArray()
    ]);
    return NextResponse.json({
      routine: routine.length ? routine.map(publicRoutine) : defaultRoutine.map((item, i) => ({ ...item, id: `sample-routine-${i}`, notes: null })),
      subjects: subjects.length ? subjects.map(publicSubject) : defaultSubjects.map((item, i) => ({ ...item, id: `sample-subject-${i}` }))
    });
  } catch (error) {
    console.error("Public data unavailable:", error);
    return NextResponse.json({
      routine: defaultRoutine.map((item, i) => ({ ...item, id: `sample-routine-${i}`, notes: null })),
      subjects: defaultSubjects.map((item, i) => ({ ...item, id: `sample-subject-${i}` })),
      demoMode: true
    });
  }
}
