import { notFound } from "next/navigation";

const sections = ["calendar", "routine", "academic", "duet", "tasks", "progress", "analytics", "settings"] as const;

export default async function ManageSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  return null;
}
