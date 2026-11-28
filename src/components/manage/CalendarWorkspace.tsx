import CurrentRoutinePanel from "@/components/manage/CurrentRoutinePanel";
import StudyCalendar from "@/components/manage/analytics/StudyCalendar";
import type { RoutineItem, StudyLog, Subject } from "@/lib/types";

type CalendarWorkspaceProps = {
  logs: StudyLog[];
  routine: RoutineItem[];
  subjects: Subject[];
};

export default function CalendarWorkspace({ logs, routine, subjects }: CalendarWorkspaceProps) {
  return (
    <section className="planner-manager planner-calendar-workspace mt-5">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(290px,.75fr)]">
        <StudyCalendar logs={logs} />
        <CurrentRoutinePanel routine={routine} subjects={subjects} />
      </div>
    </section>
  );
}
