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
    <section aria-label="Study summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {stats.map((stat) => (
        <article key={stat.label} className="card min-w-0 p-3 sm:p-4">
          <p className="text-[11px] leading-4 text-slate-500 sm:text-xs">{stat.label}</p>
          <b className="mt-1 block break-words text-xl text-green-800 sm:text-2xl">{stat.value}</b>
        </article>
      ))}
    </section>
  );
}
