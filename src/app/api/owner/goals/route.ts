import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/auth-guard";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultGoals = { academic_minutes: 0, duet_department_minutes: 0, duet_non_department_minutes: 0 };
const goalKeys = Object.keys(defaultGoals) as (keyof typeof defaultGoals)[];

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === request.nextUrl.origin; }
  catch { return false; }
}

export async function GET() {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  try {
    const record = await (await getDb()).collection("study_preferences").findOne({ key: "daily-goals" });
    const goals = Object.fromEntries(goalKeys.map((key) => [key, Number(record?.[key]) || 0]));
    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Load study goals failed:", error);
    return NextResponse.json({ error: "দৈনিক লক্ষ্য লোড করা যায়নি।" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "অনুরোধ গ্রহণ করা হয়নি।" }, { status: 403 });
  try {
    const body = await request.json() as { goals?: Record<string, unknown> };
    const supplied = body.goals || {};
    const goals = Object.fromEntries(goalKeys.map((key) => {
      const value = Number(supplied[key]);
      return [key, Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= 1440 ? value : NaN];
    })) as typeof defaultGoals;
    if (Object.values(goals).some((value) => !Number.isFinite(value))) {
      return NextResponse.json({ error: "প্রতি বিভাগের দৈনিক লক্ষ্য ০ থেকে ১৪৪০ মিনিটের মধ্যে পূরণ করো।" }, { status: 400 });
    }
    const now = new Date();
    await (await getDb()).collection("study_preferences").updateOne(
      { key: "daily-goals" },
      { $set: { ...goals, updatedAt: now }, $setOnInsert: { key: "daily-goals", createdAt: now } },
      { upsert: true },
    );
    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Save study goals failed:", error);
    return NextResponse.json({ error: "দৈনিক লক্ষ্য সংরক্ষণ করা যায়নি।" }, { status: 500 });
  }
}
