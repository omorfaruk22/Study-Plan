import type { StudyLog, StudyTask, Subject } from "@/lib/types";
import DailyStudyChart from "@/components/manage/analytics/DailyStudyChart";
import StudyCalendar from "@/components/manage/analytics/StudyCalendar";
import SubjectCategoryChart from "@/components/manage/analytics/SubjectCategoryChart";
import SubjectStudyChart from "@/components/manage/analytics/SubjectStudyChart";
import TaskStatusChart from "@/components/manage/analytics/TaskStatusChart";

type AnalyticsDashboardProps = {
  logs: StudyLog[];
  tasks: StudyTask[];
  subjects: Subject[];
};

export default function AnalyticsDashboard({ logs, tasks, subjects }: AnalyticsDashboardProps) {
  return (
    <section className="mt-5">
      <header className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-green-700">Study insights</p>
        <h2 className="mt-1 text-xl font-black text-green-950 sm:text-2xl">তোমার পড়াশোনার চিত্র</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          পড়ার সময়, বিভাগভিত্তিক subject সংখ্যা এবং কাজের অগ্রগতি এক জায়গায় দেখো।
        </p>
      </header>
      <div className="mb-4">
        <StudyCalendar logs={logs} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DailyStudyChart logs={logs} />
        <SubjectStudyChart logs={logs} subjects={subjects} />
        <TaskStatusChart tasks={tasks} />
        <SubjectCategoryChart subjects={subjects} />
      </div>
    </section>
  );
}
