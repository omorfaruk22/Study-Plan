import { notFound } from "next/navigation";

const sections = ["academic", "duet", "tasks", "analytics"] as const;

export default async function ManageSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  return null;
}
