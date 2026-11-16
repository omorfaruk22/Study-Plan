export type StudyTrack = "academic" | "duet_department" | "duet_non_department";

export type SubjectCategory = "Academic" | "DUET Department" | "DUET Non-Department";

export type PublicStudyStats = {
  academic_minutes: number;
  duet_department_minutes: number;
  duet_non_department_minutes: number;
};

export type Subject = {
  id: string;
  name: string;
  category: string;
  code?: string | null;
  color?: string | null;
};

export type RoutineItem = {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  title: string;
  subject_id?: string | null;
  subject_name?: string | null;
  category: string;
  notes?: string | null;
  sort_order: number;
};

export type StudyLog = {
  id: string;
  study_date: string;
  subject_id?: string | null;
  subject_name?: string | null;
  study_track?: StudyTrack | null;
  topic: string;
  planned_minutes: number;
  actual_minutes: number;
  status: string;
  understanding?: number | null;
  notes?: string | null;
};

export type StudyTask = {
  id: string;
  title: string;
  subject_id?: string | null;
  subject_name?: string | null;
  task_type: string;
  due_date?: string | null;
  priority: string;
  status: string;
  notes?: string | null;
};

export type RoutineInput = Omit<RoutineItem, "id">;
export type StudyLogInput = Omit<StudyLog, "id">;
export type StudyTaskInput = Omit<StudyTask, "id">;
export type SubjectInput = Omit<Subject, "id">;

export type OwnerCollection = "weekly_routine" | "study_logs" | "study_tasks" | "subjects";

export type OwnerWorkspaceData = {
  routine: RoutineItem[];
  logs: StudyLog[];
  tasks: StudyTask[];
  subjects: Subject[];
};
