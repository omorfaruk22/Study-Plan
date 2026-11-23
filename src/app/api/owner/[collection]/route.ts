import { NextRequest, NextResponse } from "next/server";
import { isOwner } from "@/lib/auth-guard";
import { getDb } from "@/lib/mongodb";
import { ownerFields, pickOwnerRecord, validateOwnerRecord, type OwnerCollection } from "@/lib/owner-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === request.nextUrl.origin; }
  catch { return false; }
}

export async function POST(request: NextRequest, context: { params: Promise<{ collection: string }> }) {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "অনুরোধ গ্রহণ করা হয়নি।" }, { status: 403 });
  const { collection } = await context.params;
  if (!Object.prototype.hasOwnProperty.call(ownerFields, collection)) return NextResponse.json({ error: "অবৈধ collection।" }, { status: 404 });
  const ownerCollection = collection as OwnerCollection;
  try {
    const data = pickOwnerRecord(await request.json(), ownerCollection);
    if (!data) return NextResponse.json({ error: "তথ্যের format সঠিক নয়।" }, { status: 400 });
    const validationError = validateOwnerRecord(ownerCollection, data, true);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const now = new Date();
    const result = await (await getDb()).collection(ownerCollection).insertOne({ ...data, createdAt: now, updatedAt: now });
    return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error(`Create ${collection} failed:`, error);
    return NextResponse.json({ error: "তথ্য সংরক্ষণ করা যায়নি। MongoDB সেটআপ পরীক্ষা করো।" }, { status: 500 });
  }
}
