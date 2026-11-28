import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ManageWorkspaceRouter from "@/components/manage/ManageWorkspaceRouter";
import StopwatchIdleMonitor from "@/components/manage/StopwatchIdleMonitor";

export const dynamic = "force-dynamic";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const currentEmail = (session?.user?.email || "").trim().toLowerCase();
  const ownerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  if (!ownerEmail || currentEmail !== ownerEmail) redirect("/login");
  const profile = {
    name: session?.user?.name?.trim() || null,
    email: currentEmail,
    image: session?.user?.image || null,
  };
  return (
    <>
      <StopwatchIdleMonitor />
      <ManageWorkspaceRouter profile={profile} />
      {children}
    </>
  );
}
