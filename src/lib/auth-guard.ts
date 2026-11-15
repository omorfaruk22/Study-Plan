import { auth } from "@/auth";

export async function isOwner() {
  const session = await auth();
  const email = (session?.user?.email || "").trim().toLowerCase();
  const owner = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  return Boolean(owner && email && email === owner);
}
