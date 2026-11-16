import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ManageWorkspaceRouter from "@/components/manage/ManageWorkspaceRouter";

export const dynamic = "force-dynamic";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const currentEmail = (session?.user?.email || "").trim().toLowerCase();
  const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  if (!ownerEmail || currentEmail !== ownerEmail) redirect("/login");
  return (
    <>
      <ManageWorkspaceRouter />
      {children}
    </>
  );
}
