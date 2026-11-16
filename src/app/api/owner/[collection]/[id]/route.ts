import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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
  study_logs: ["study_date", "subject_id", "subject_name", "study_track", "topic", "planned_minutes", "actual_minutes", "status", "understanding", "notes"],
  study_tasks: ["title", "subject_id", "subject_name", "task_type", "due_date", "priority", "status", "notes"],
  subjects: ["name", "category", "code", "color"]
};

function safeData(input: Record<string, unknown>, allowed: string[]) {
  const data: Record<string, unknown> = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(input, key)) data[key] = input[key];
  return data;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ collection: string; id: string }> }) {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "অনুরোধ গ্রহণ করা হয়নি।" }, { status: 403 });
  const { collection, id } = await context.params;
  if (!fields[collection] || !ObjectId.isValid(id)) return NextResponse.json({ error: "তথ্য পাওয়া যায়নি।" }, { status: 404 });
  try {
    const data = safeData(await request.json() as Record<string, unknown>, fields[collection]);
    const result = await (await getDb()).collection(collection).updateOne(
      { _id: new ObjectId(id) }, { $set: { ...data, updatedAt: new Date() } }
    );
    if (!result.matchedCount) return NextResponse.json({ error: "তথ্য পাওয়া যায়নি।" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Update ${collection} failed:`, error);
    return NextResponse.json({ error: "আপডেট হচ্ছে না!" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ collection: string; id: string }> }) {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই!" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "অনুরোধ গ্রহণ করা হয়নি!" }, { status: 403 });
  const { collection, id } = await context.params;
  if (!fields[collection] || !ObjectId.isValid(id)) return NextResponse.json({ error: "তথ্য পাওয়া যায়নি।" }, { status: 404 });
  try {
    const result = await (await getDb()).collection(collection).deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return NextResponse.json({ error: "তথ্য পাওয়া যায়নি।" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Delete ${collection} failed:`, error);
    return NextResponse.json({ error: "মুছে ফেলা যায়নি।" }, { status: 500 });
  }
}
