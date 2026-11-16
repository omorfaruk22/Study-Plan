"use client";

import { BookOpenCheck } from "lucide-react";
import StudyLogsManager from "@/components/manage/StudyLogsManager";
import SubjectsManager from "@/components/manage/SubjectsManager";
import type { StudyLog, StudyLogInput, Subject, SubjectInput } from "@/lib/types";

type AcademicManagerProps = {
  logs: StudyLog[];
  subjects: Subject[];
  busy: boolean;
  onSave: (item: StudyLogInput, id?: string) => Promise<boolean>;
  onSaveSubject: (item: SubjectInput, id?: string) => Promise<boolean>;
  onDeleteLog: (id: string) => void;
  onDeleteSubject: (id: string) => void;
};

export default function AcademicManager({ logs, subjects, busy, onSave, onSaveSubject, onDeleteLog, onDeleteSubject }: AcademicManagerProps) {
  const academicLogs = logs.filter((log) => log.study_track === "academic");
  const academicSubjects = subjects.filter((subject) => subject.category === "Academic");

  return (
    <section className="mt-5">
      <header className="mb-4 rounded-2xl border border-green-100 bg-green-50/70 p-3.5 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-green-700"><BookOpenCheck size={21} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-green-700">Academic study</p>
            <h2 className="text-xl font-extrabold text-green-950">একাডেমিক পড়া</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">এই পেজে নিজের একাডেমিক বিষয় যোগ করো এবং প্রতিদিনের পড়ার সময় ও টপিক সংরক্ষণ করো।</p>
      </header>
      <SubjectsManager subjects={academicSubjects} category="Academic" busy={busy} onSave={onSaveSubject} onDelete={onDeleteSubject} />
      <StudyLogsManager key="academic" logs={academicLogs} subjects={academicSubjects} studyTrack="academic" busy={busy} onSave={onSave} onDelete={onDeleteLog} />
    </section>
  );
}
