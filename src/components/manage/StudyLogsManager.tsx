"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import type { StudyLog, StudyLogInput, StudyTrack, Subject } from "@/lib/types";
import { getDhakaDateKey } from "@/lib/routine-time";
import StudyStopwatch from "@/components/manage/StudyStopwatch";
import {
  EmptyState,
  FormField,
  getSubjectInputValue,
  getSubjectName,
  normalizeSubjectInput,
  RecordActions,
  resolveSubjectInput,
  SubjectField,
} from "@/components/manage/ManagerPrimitives";

type StudyLogsManagerProps = {
  logs: StudyLog[];
  subjects: Subject[];
  studyTrack: StudyTrack;
  busy: boolean;
  onSave: (item: StudyLogInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function today() {
  return getDhakaDateKey();
}

function createEmptyLog(studyTrack: StudyTrack): StudyLogInput {
  return {
    study_date: today(), subject_id: null, subject_name: null, study_track: studyTrack, topic: "", planned_minutes: 60,
    actual_minutes: 60, status: "সম্পন্ন", understanding: 3, notes: "",
  };
}

export default function StudyLogsManager({ logs, subjects, studyTrack, busy, onSave, onDelete }: StudyLogsManagerProps) {
  const [form, setForm] = useState<StudyLogInput>(() => createEmptyLog(studyTrack));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTimerTrack, setActiveTimerTrack] = useState<StudyTrack | null>(null);
  const stopwatchEntry: StudyLogInput = {
    ...form,
    study_track: studyTrack,
    topic: form.topic.trim() || getSubjectInputValue(subjects, form.subject_id, form.subject_name).trim(),
  };

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyLog(studyTrack));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || activeTimerTrack) return;
    const subjectName = getSubjectInputValue(subjects, form.subject_id, form.subject_name);
    const saveData: StudyLogInput = {
      ...form,
      study_track: studyTrack,
      ...normalizeSubjectInput(subjects, subjectName),
    };
    if (await onSave(saveData, editingId || undefined)) resetForm();
  }

  function editItem(item: StudyLog) {
    setEditingId(item.id);
    setForm({
      study_date: item.study_date,
      subject_id: item.subject_id || null,
      subject_name: item.subject_name || null,
      study_track: studyTrack,
      topic: item.topic,
      planned_minutes: item.planned_minutes,
      actual_minutes: item.actual_minutes,
      status: item.status,
      understanding: item.understanding ?? 3,
      notes: item.notes || "",
    });
  }

  const trackLabel = studyTrack === "academic" ? "একাডেমিক" : studyTrack === "duet_department" ? "DUET Department" : "DUET Non-Department";

  return (
    <div className="planner-manager-grid mt-5 grid gap-5 lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)]">
      <section className="card p-3.5 sm:p-5">
        <h2 className="mb-4 font-extrabold text-green-950">{editingId ? "পড়ার হিসাব সম্পাদনা" : `${trackLabel} পড়া যোগ করো`}</h2>
        <StudyStopwatch
          entry={stopwatchEntry}
          canStart={!editingId && Boolean(stopwatchEntry.topic.trim())}
          busy={busy}
          onSessionChange={setActiveTimerTrack}
          onFinish={async (timedEntry) => {
            const saved = await onSave(timedEntry);
            if (saved && timedEntry.study_track === studyTrack) resetForm();
            return saved;
          }}
        />
        <form onSubmit={handleSubmit}>
          <fieldset disabled={Boolean(activeTimerTrack)} className="grid min-w-0 gap-3 border-0 p-0 disabled:opacity-60">
          {editingId ? (
            <FormField label="তারিখ">
              <input type="date" className="field" value={form.study_date} onChange={(event) => setForm({ ...form, study_date: event.target.value })} />
            </FormField>
          ) : (
            <FormField label="তারিখ (স্বয়ংক্রিয়)">
              <p className="field flex items-center text-slate-500">Stopwatch শুরু হলে আজকের তারিখ নিজে থেকেই সেভ হবে</p>
            </FormField>
          )}
          <FormField label="বিষয়">
            <SubjectField
              subjects={subjects}
              listId={`${studyTrack}-study-log-subjects`}
              value={getSubjectInputValue(subjects, form.subject_id, form.subject_name)}
              optional
              onChange={(value) => setForm({ ...form, ...resolveSubjectInput(subjects, value) })}
            />
          </FormField>
          <FormField label="আজ কী পড়লে?">
            <input required className="field" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} placeholder="পড়া বা টপিকের নাম" />
          </FormField>
          <FormField label="পরিকল্পিত মিনিট (ঐচ্ছিক)">
            <input type="number" min="0" className="field" value={form.planned_minutes} onChange={(event) => setForm({ ...form, planned_minutes: Number(event.target.value) })} />
          </FormField>
          <div className={`grid ${editingId ? "grid-cols-1 min-[420px]:grid-cols-2" : "grid-cols-1"} gap-3`}>
            {editingId && (
              <FormField label="অবস্থা">
                <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  {["সম্পন্ন", "আংশিক", "চলছে", "শুরু হয়নি"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </FormField>
            )}
            <FormField label="বোঝার মান (১–৫)">
              <select className="field" value={form.understanding || 3} onChange={(event) => setForm({ ...form, understanding: Number(event.target.value) })}>
                {[1, 2, 3, 4, 5].map((rating) => <option key={rating}>{rating}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="নোট">
            <textarea className="field min-h-16" value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </FormField>
          {editingId ? (
            <div className="flex gap-2">
              <button disabled={busy || Boolean(activeTimerTrack)} className="btn btn-primary flex-1 disabled:opacity-50">
                <Save size={16} /> {busy ? "আপডেট হচ্ছে..." : "আপডেট করো"}
              </button>
            </div>
          ) : (
            <p className="rounded-xl bg-green-500/10 px-3 py-2.5 text-xs font-semibold leading-relaxed text-green-800">
              পড়া শুরু ও শেষ করলে সময়, তারিখ এবং সম্পন্ন অবস্থা stopwatch থেকে স্বয়ংক্রিয়ভাবে সেভ হবে।
            </p>
          )}
          </fieldset>
          {editingId && <button type="button" onClick={resetForm} className="btn btn-plain mt-3">বাতিল</button>}
        </form>
      </section>

      <section className="card p-3.5 sm:p-5">
        <h2 className="mb-4 font-extrabold text-green-950">{trackLabel} পড়ার হিসাব ({logs.length})</h2>
        <div className="space-y-3">
          {logs.length === 0 ? <EmptyState>এখনো কোনো পড়ার হিসাব যোগ করা হয়নি।</EmptyState> : logs.map((item) => (
            <article key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="break-words text-xs font-bold text-green-700">{item.study_date} · {item.actual_minutes} মিনিট</p>
                <p className="mt-1 break-words text-sm font-bold">{item.topic}</p>
                <p className="mt-1 break-words text-xs text-slate-500">
                  {getSubjectName(subjects, item.subject_id, item.subject_name)} · {item.status} · বোঝা {item.understanding ?? "—"}/5
                </p>
                {item.notes && <p className="mt-1 text-xs text-slate-400">{item.notes}</p>}
              </div>
              <RecordActions disabled={busy} onEdit={() => editItem(item)} onDelete={() => onDelete(item.id)} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
