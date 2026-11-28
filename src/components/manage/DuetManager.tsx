"use client";

import { useState } from "react";
import { BookOpenCheck } from "lucide-react";
import StudyLogsManager from "@/components/manage/StudyLogsManager";
import SubjectsManager from "@/components/manage/SubjectsManager";
import { getSubjectStudyTrack, resolveStudyTrack } from "@/lib/study-track";
import type { StudyLog, StudyLogInput, StudyTrack, Subject, SubjectCategory, SubjectInput } from "@/lib/types";

type DuetManagerProps = {
  logs: StudyLog[];
  subjects: Subject[];
  busy: boolean;
  onSave: (item: StudyLogInput, id?: string) => Promise<boolean>;
  onSaveSubject: (item: SubjectInput, id?: string) => Promise<boolean>;
  onDeleteLog: (id: string) => void;
  onDeleteSubject: (id: string) => void;
};

const duetSections: { track: StudyTrack; category: SubjectCategory; label: string; shortLabel: string }[] = [
  { track: "duet_department", category: "DUET Department", label: "Department", shortLabel: "Department" },
  { track: "duet_non_department", category: "DUET Non-Department", label: "Non-Department", shortLabel: "Non-Department" },
];

export default function DuetManager({ logs, subjects, busy, onSave, onSaveSubject, onDeleteLog, onDeleteSubject }: DuetManagerProps) {
  const [studyTrack, setStudyTrack] = useState<StudyTrack>("duet_department");
  const selected = duetSections.find((section) => section.track === studyTrack) || duetSections[0];
  const sectionSubjects = subjects.filter((subject) => getSubjectStudyTrack(subject) === selected.track);
  const sectionLogs = logs.filter((log) => resolveStudyTrack(log, subjects) === selected.track);

  return (
    <section className="planner-manager planner-manager-duet mt-5">
      <header className="planner-manager-hero mb-4 rounded-2xl border border-green-100 bg-green-50/70 p-3.5 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-green-700"><BookOpenCheck size={21} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-green-700">DUET preparation</p>
            <h2 className="text-xl font-extrabold text-green-950">DUET পড়া</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">Department বা Non-Department বেছে নিয়ে নিজের বিষয় এবং প্রতিদিনের পড়ার হিসাব আলাদাভাবে যোগ করো।</p>
      </header>

      <div role="tablist" aria-label="DUET study section" className="mb-2 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 sm:inline-grid sm:w-auto">
        {duetSections.map((section) => (
          <button
            key={section.track}
            type="button"
            role="tab"
            aria-selected={studyTrack === section.track}
            onClick={() => setStudyTrack(section.track)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${studyTrack === section.track ? "bg-green-700 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
          >
            {section.shortLabel}
          </button>
        ))}
      </div>

      <SubjectsManager key={selected.category} subjects={sectionSubjects} category={selected.category} busy={busy} onSave={onSaveSubject} onDelete={onDeleteSubject} />
      <StudyLogsManager key={selected.track} logs={sectionLogs} subjects={sectionSubjects} studyTrack={selected.track} busy={busy} onSave={onSave} onDelete={onDeleteLog} />
    </section>
  );
}
