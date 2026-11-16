import type { StudyTask } from "@/lib/types";
import ChartCard from "@/components/manage/analytics/ChartCard";

const statusColors: Record<string, string> = {
  "শুরু হয়নি": "bg-slate-300",
  "চলছে": "bg-amber-400",
  "সম্পন্ন": "bg-green-600",
  "জমা হয়েছে": "bg-emerald-900",
};

const statusDots: Record<string, string> = {
  "শুরু হয়নি": "bg-slate-300",
  "চলছে": "bg-amber-400",
  "সম্পন্ন": "bg-green-600",
  "জমা হয়েছে": "bg-emerald-900",
};

export default function TaskStatusChart({ tasks }: { tasks: StudyTask[] }) {
  const counts = tasks.reduce<Record<string, number>>((result, task) => {
    const status = task.status || "অবস্থা নেই";
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});
  const knownStatuses = ["শুরু হয়নি", "চলছে", "সম্পন্ন", "জমা হয়েছে"];
  const statuses = [...knownStatuses, ...Object.keys(counts).filter((status) => !knownStatuses.includes(status))];

  return (
    <ChartCard title="কাজের অগ্রগতি" description="Assignment ও পরীক্ষার বর্তমান অবস্থা।">
      {tasks.length === 0 ? (
        <p className="rounded-xl bg-green-50 px-3 py-5 text-center text-sm text-green-800">এখনও কোনো task যোগ করা হয়নি।</p>
      ) : (
        <>
          <div className="flex h-5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Task status distribution">
            {statuses.map((status) => {
              const count = counts[status] || 0;
              if (!count) return null;
              return (
                <div
                  key={status}
                  title={`${status}: ${count}`}
                  className={statusColors[status] || "bg-green-300"}
                  style={{ width: `${(count / tasks.length) * 100}%` }}
                />
              );
            })}
          </div>
          <div className="mt-4 space-y-2.5">
            {statuses.map((status) => (
              <div key={status} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDots[status] || "bg-green-300"}`} />
                  <span className="break-words">{status}</span>
                </span>
                <span className="shrink-0 font-bold text-green-950">{counts[status] || 0}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="mt-4 text-right text-xs font-semibold text-green-800">মোট {tasks.length}টি কাজ</p>
    </ChartCard>
  );
}
