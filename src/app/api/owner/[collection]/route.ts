import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/auth-guard";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === request.nextUrl.origin; }
  catch { return false; }
}

const fields: Record<string, string[]> = {
  weekly_routine: ["day", "start_time", "end_time", "title", "subject_id", "subject_name", "category", "notes", "sort_order"],
  study_logs: ["study_date", "subject_id", "subject_name", "topic", "planned_minutes", "actual_minutes", "status", "understanding", "notes"],
  study_tasks: ["title", "subject_id", "subject_name", "task_type", "due_date", "priority", "status", "notes"],
  subjects: ["name", "category", "code", "color"]
};

function pick(input: Record<string, unknown>, allowed: string[]) {
  const output: Record<string, unknown> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(input, key)) output[key] = input[key];
  }
  return output;
}

export async function POST(request: NextRequest, context: { params: Promise<{ collection: string }> }) {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "অনুরোধ গ্রহণ করা হয়নি।" }, { status: 403 });
  const { collection } = await context.params;
  const allowed = fields[collection];
  if (!allowed) return NextResponse.json({ error: "অবৈধ collection।" }, { status: 404 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const data = pick(body, allowed);
    const required = collection === "weekly_routine" ? ["day", "start_time", "end_time", "title", "category"]
      : collection === "study_logs" ? ["study_date", "topic"]
      : collection === "study_tasks" ? ["title"] : ["name", "category"];
    if (required.some(key => !String(data[key] ?? "").trim())) {
      return NextResponse.json({ error: "প্রয়োজনীয় তথ্য পূরণ করো।" }, { status: 400 });
    }
    const now = new Date();
    const result = await (await getDb()).collection(collection).insertOne({ ...data, createdAt: now, updatedAt: now });
    return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error(`Create ${collection} failed:`, error);
    return NextResponse.json({ error: "তথ্য সংরক্ষণ করা যায়নি। MongoDB সেটআপ পরীক্ষা করো।" }, { status: 500 });
  }
}
