import type { RoutineItem, StudyLog, StudyTask } from "@/lib/types";

type WorkspaceStatsProps = {
  routine: RoutineItem[];
  logs: StudyLog[];
  tasks: StudyTask[];
};

export default function WorkspaceStats({ routine, logs, tasks }: WorkspaceStatsProps) {
  const totalMinutes = logs.reduce((total, item) => total + (Number(item.actual_minutes) || 0), 0);
  const completedTasks = tasks.filter((task) => task.status === "সম্পন্ন" || task.status === "জমা হয়েছে").length;

  const stats = [
    { label: "রুটিন আইটেম", value: String(routine.length) },
    { label: "সেভ করা পড়ার সেশন", value: String(logs.length) },
    { label: "মোট পড়ার সময়", value: `${(totalMinutes / 60).toFixed(1)} ঘণ্টা` },
    { label: "সম্পন্ন কাজ", value: `${completedTasks}/${tasks.length}` },
  ];

  return (
    <section aria-label="Study summary" className="mt-6 grid gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.label} className="card p-4">
          <p className="text-xs text-slate-500">{stat.label}</p>
          <b className="mt-1 block text-2xl text-green-800">{stat.value}</b>
        </article>
      ))}
    </section>
  );
}
