import DailyStudyChart from "@/components/manage/analytics/DailyStudyChart";
import SubjectCategoryChart from "@/components/manage/analytics/SubjectCategoryChart";
import SubjectStudyChart from "@/components/manage/analytics/SubjectStudyChart";
import TaskStatusChart from "@/components/manage/analytics/TaskStatusChart";
import { formatMinutes } from "@/components/manage/analytics/chart-utils";
import type { StudyLog, StudyTask, Subject } from "@/lib/types";

type ProgressWorkspaceProps = {
  logs: StudyLog[];
  tasks: StudyTask[];
  subjects: Subject[];
};

export default function ProgressWorkspace({ logs, tasks, subjects }: ProgressWorkspaceProps) {
  const totalMinutes = logs.reduce((total, log) => total + Math.max(0, Number(log.actual_minutes) || 0), 0);
  const completedTasks = tasks.filter((task) => task.status === "সম্পন্ন" || task.status === "জমা হয়েছে").length;
  const completion = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <section className="planner-manager planner-progress-workspace mt-5">
      <header className="planner-progress-header">
        <div>
          <p>Progress overview</p>
          <h2>তোমার পড়াশোনার অগ্রগতি</h2>
          <span>লাইভ study log, subject এবং কাজের তথ্য থেকে তৈরি।</span>
        </div>
        <div className="planner-progress-summary" aria-label="Progress summary">
          <div><span>মোট পড়া</span><strong>{formatMinutes(totalMinutes)}</strong></div>
          <div><span>সম্পন্ন কাজ</span><strong>{tasks.length ? `${completedTasks}/${tasks.length}` : "কোনো কাজ নেই"}</strong></div>
          <div><span>কাজের অগ্রগতি</span><strong>{tasks.length ? `${completion}%` : "—"}</strong></div>
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <DailyStudyChart logs={logs} />
        <SubjectStudyChart logs={logs} subjects={subjects} />
        <TaskStatusChart tasks={tasks} />
        <SubjectCategoryChart subjects={subjects} />
      </div>
    </section>
  );
}
