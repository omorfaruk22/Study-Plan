import StudyCalendar from "@/components/manage/analytics/StudyCalendar";
import type { StudyLog } from "@/lib/types";

type CalendarWorkspaceProps = {
  logs: StudyLog[];
};

export default function CalendarWorkspace({ logs }: CalendarWorkspaceProps) {
  return (
    <section className="planner-manager planner-calendar-workspace mt-5">
      <StudyCalendar logs={logs} />
    </section>
  );
}
