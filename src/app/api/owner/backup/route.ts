import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { isOwner } from "@/lib/auth-guard";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fields = {
  weekly_routine: ["day", "start_time", "end_time", "title", "subject_id", "subject_name", "category", "notes", "sort_order"],
  study_logs: ["study_date", "subject_id", "subject_name", "study_track", "topic", "planned_minutes", "actual_minutes", "status", "understanding", "notes", "review_due_date", "last_reviewed_date"],
  study_tasks: ["title", "subject_id", "subject_name", "task_type", "due_date", "priority", "status", "notes"],
  subjects: ["name", "category", "code", "color"],
} as const;

type CollectionName = keyof typeof fields;
const collectionNames = Object.keys(fields) as CollectionName[];
const requiredFields: Record<CollectionName, string[]> = {
  weekly_routine: ["day", "start_time", "end_time", "title", "category"],
  study_logs: ["study_date", "topic"],
  study_tasks: ["title"],
  subjects: ["name", "category"],
};
const defaultGoals = { academic_minutes: 0, duet_department_minutes: 0, duet_non_department_minutes: 0 };

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === request.nextUrl.origin; }
  catch { return false; }
}

function serialize(document: Record<string, unknown>) {
  const { _id, ...rest } = document;
  return { ...rest, id: String(_id) };
}

export async function GET() {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  try {
    const db = await getDb();
    const [routine, logs, tasks, subjects, goalRecord] = await Promise.all([
      db.collection("weekly_routine").find({}).sort({ sort_order: 1, day: 1, start_time: 1 }).toArray(),
      db.collection("study_logs").find({}).sort({ study_date: -1, createdAt: -1 }).toArray(),
      db.collection("study_tasks").find({}).sort({ due_date: 1, createdAt: -1 }).toArray(),
      db.collection("subjects").find({}).sort({ category: 1, name: 1 }).toArray(),
      db.collection("study_preferences").findOne({ key: "daily-goals" }),
    ]);
    const goals = Object.fromEntries(Object.keys(defaultGoals).map((key) => [key, Number(goalRecord?.[key]) || 0]));
    return NextResponse.json({
      format: "faruk-study-manager-backup", version: 1, exportedAt: new Date().toISOString(),
      weekly_routine: routine.map(serialize), study_logs: logs.map(serialize), study_tasks: tasks.map(serialize), subjects: subjects.map(serialize), goals,
    });
  } catch (error) {
    console.error("Export study backup failed:", error);
    return NextResponse.json({ error: "Backup তৈরি করা যায়নি। MongoDB সংযোগ পরীক্ষা করো।" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "অনুরোধ গ্রহণ করা হয়নি।" }, { status: 403 });
  try {
    const body = await request.json() as { backup?: Record<string, unknown> };
    const backup = body.backup;
    if (!backup || backup.format !== "faruk-study-manager-backup" || backup.version !== 1) {
      return NextResponse.json({ error: "এই backup format সমর্থিত নয়।" }, { status: 400 });
    }
    for (const collection of collectionNames) {
      if (!Array.isArray(backup[collection]) || (backup[collection] as unknown[]).length > 5000) {
        return NextResponse.json({ error: "Backup-এর তথ্য যাচাই করা যায়নি।" }, { status: 400 });
      }
    }
    for (const collection of collectionNames) {
      const records = backup[collection] as unknown[];
      for (const record of records) {
        if (!record || typeof record !== "object" || !/^[a-fA-F0-9]{24}$/.test(String((record as Record<string, unknown>).id || ""))) {
          return NextResponse.json({ error: "Backup-এ একটি record ID সঠিক নয়।" }, { status: 400 });
        }
        const data = record as Record<string, unknown>;
        if (requiredFields[collection].some((key) => !String(data[key] ?? "").trim())) {
          return NextResponse.json({ error: "Backup-এ প্রয়োজনীয় তথ্য নেই বা সঠিক নয়।" }, { status: 400 });
        }
      }
    }
    const goalInput = backup.goals as Record<string, unknown> | undefined;
    const goalKeys = Object.keys(defaultGoals) as (keyof typeof defaultGoals)[];
    const goals = Object.fromEntries(goalKeys.map((key) => {
      const value = Number(goalInput?.[key] ?? 0);
      return [key, Number.isInteger(value) && value >= 0 && value <= 1440 ? value : NaN];
    })) as typeof defaultGoals;
    if (Object.values(goals).some((value) => !Number.isFinite(value))) {
      return NextResponse.json({ error: "Backup-এর দৈনিক লক্ষ্যগুলো সঠিক নয়।" }, { status: 400 });
    }

    const db = await getDb();
    const restored: Record<CollectionName, number> = { weekly_routine: 0, study_logs: 0, study_tasks: 0, subjects: 0 };
    for (const collection of collectionNames) {
      const records = backup[collection] as Record<string, unknown>[];
      const operations = records.map((record) => {
        const data: Record<string, unknown> = {};
        for (const key of fields[collection]) {
          if (Object.prototype.hasOwnProperty.call(record, key)) data[key] = record[key];
        }
        return {
          updateOne: {
            filter: { _id: new ObjectId(String(record.id)) },
            update: { $set: { ...data, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
            upsert: true,
          },
        };
      });
      if (operations.length) {
        await db.collection(collection).bulkWrite(operations, { ordered: false });
        restored[collection] = operations.length;
      }
    }
    const now = new Date();
    await db.collection("study_preferences").updateOne(
      { key: "daily-goals" },
      { $set: { ...goals, updatedAt: now }, $setOnInsert: { key: "daily-goals", createdAt: now } },
      { upsert: true },
    );
    return NextResponse.json({ restored, goals });
  } catch (error) {
    console.error("Restore study backup failed:", error);
    const message = error instanceof Error && error.message.includes("record ID")
      ? error.message
      : "Backup restore সম্পূর্ণ করা যায়নি। ফাইলটি পরীক্ষা করে আবার চেষ্টা করো।";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
