import type { Subject } from "@/lib/types";

type SubjectListProps = {
  subjects: Subject[];
};

export default function SubjectList({ subjects }: SubjectListProps) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-green-950">বিষয় তালিকা</h2>
        <span className="text-xs text-slate-400">{subjects.length}টি বিষয়</span>
      </div>
      {subjects.length === 0 ? (
        <p className="card p-5 text-center text-sm text-slate-500">এখনো কোনো বিষয় যোগ করা হয়নি।</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <article key={subject.id} className="card p-4">
              <span className="text-[11px] font-bold text-green-700">
                {subject.category}{subject.code ? ` · ${subject.code}` : ""}
              </span>
              <p className="mt-1 font-semibold">{subject.name}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
