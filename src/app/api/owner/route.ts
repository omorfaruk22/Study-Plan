import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { isOwner } from "@/lib/auth-guard";
import { getDb } from "@/lib/mongodb";
import { defaultRoutine } from "@/lib/defaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc: Record<string, unknown>) {
  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id) };
}

export async function GET() {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  try {
    const db = await getDb();
    const subjectCollection = db.collection("subjects");
    const routineCollection = db.collection("weekly_routine");

    if (await routineCollection.countDocuments() === 0) {
      const now = new Date();
      await routineCollection.bulkWrite(defaultRoutine.map((item, index) => ({
        updateOne: {
          filter: { _id: new ObjectId(String(index + 1).padStart(24, "0")) },
          update: { $setOnInsert: { ...item, createdAt: now, updatedAt: now } },
          upsert: true,
        },
      })), { ordered: false });
    }

    const [routine, logs, tasks, subjects] = await Promise.all([
      routineCollection.find({}).sort({ sort_order: 1, day: 1, start_time: 1 }).toArray(),
      db.collection("study_logs").find({}).sort({ study_date: -1, createdAt: -1 }).toArray(),
      db.collection("study_tasks").find({}).sort({ due_date: 1, createdAt: -1 }).toArray(),
      subjectCollection.find({}).sort({ category: 1, name: 1 }).toArray()
    ]);
    return NextResponse.json({ routine: routine.map(serialize), logs: logs.map(serialize), tasks: tasks.map(serialize), subjects: subjects.map(serialize) });
  } catch (error) {
    console.error("Owner bootstrap failed:", error);
    return NextResponse.json({ error: "MongoDB সংযোগ পাওয়া যাচ্ছে না। .env.local-এর MONGODB_URI, Atlas cluster Active আছে কি না, এবং Atlas Network Access-এ আপনার IP অনুমোদিত কি না পরীক্ষা করো।" }, { status: 503 });
  }
}
