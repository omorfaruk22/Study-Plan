import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
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

export async function PATCH(request: NextRequest, context: { params: Promise<{ collection: string; id: string }> }) {
  if (!(await isOwner())) return NextResponse.json({ error: "অনুমতি নেই।" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "অনুরোধ গ্রহণ করা হয়নি।" }, { status: 403 });
  const { collection, id } = await context.params;
  if (!Object.prototype.hasOwnProperty.call(ownerFields, collection) || !ObjectId.isValid(id)) return NextResponse.json({ error: "তথ্য পাওয়া যায়নি।" }, { status: 404 });
  const ownerCollection = collection as OwnerCollection;
  try {
    const data = pickOwnerRecord(await request.json(), ownerCollection);
    if (!data) return NextResponse.json({ error: "তথ্যের format সঠিক নয়।" }, { status: 400 });
    const validationError = validateOwnerRecord(ownerCollection, data);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const result = await (await getDb()).collection(ownerCollection).updateOne(
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
  if (!Object.prototype.hasOwnProperty.call(ownerFields, collection) || !ObjectId.isValid(id)) return NextResponse.json({ error: "তথ্য পাওয়া যায়নি।" }, { status: 404 });
  const ownerCollection = collection as OwnerCollection;
  try {
    const result = await (await getDb()).collection(ownerCollection).deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return NextResponse.json({ error: "তথ্য পাওয়া যায়নি।" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Delete ${collection} failed:`, error);
    return NextResponse.json({ error: "মুছে ফেলা যায়নি।" }, { status: 500 });
  }
}
