"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import type { StudyLog, StudyLogInput, Subject } from "@/lib/types";
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
  busy: boolean;
  onSave: (item: StudyLogInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function createEmptyLog(): StudyLogInput {
  return {
    study_date: today(), subject_id: null, subject_name: null, topic: "", planned_minutes: 60,
    actual_minutes: 60, status: "সম্পন্ন", understanding: 3, notes: "",
  };
}

export default function StudyLogsManager({ logs, subjects, busy, onSave, onDelete }: StudyLogsManagerProps) {
  const [form, setForm] = useState<StudyLogInput>(createEmptyLog);
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyLog());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subjectName = getSubjectInputValue(subjects, form.subject_id, form.subject_name);
    const saveData: StudyLogInput = {
      ...form,
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
      topic: item.topic,
      planned_minutes: item.planned_minutes,
      actual_minutes: item.actual_minutes,
      status: item.status,
      understanding: item.understanding ?? 3,
      notes: item.notes || "",
    });
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)]">
      <section className="card p-5">
        <h2 className="mb-4 font-extrabold text-green-950">{editingId ? "পড়ার লগ সম্পাদনা" : "আজকের পড়া এন্ট্রি"}</h2>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <FormField label="তারিখ">
            <input type="date" className="field" value={form.study_date} onChange={(event) => setForm({ ...form, study_date: event.target.value })} />
          </FormField>
          <FormField label="বিষয়">
            <SubjectField
              subjects={subjects}
              listId="study-log-subject-suggestions"
              value={getSubjectInputValue(subjects, form.subject_id, form.subject_name)}
              optional
              onChange={(value) => setForm({ ...form, ...resolveSubjectInput(subjects, value) })}
            />
          </FormField>
          <FormField label="টপিক">
            <input required className="field" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} placeholder="আজ কী পড়লে?" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="পরিকল্পিত মিনিট">
              <input type="number" min="0" className="field" value={form.planned_minutes} onChange={(event) => setForm({ ...form, planned_minutes: Number(event.target.value) })} />
            </FormField>
            <FormField label="বাস্তব মিনিট">
              <input type="number" min="0" className="field" value={form.actual_minutes} onChange={(event) => setForm({ ...form, actual_minutes: Number(event.target.value) })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="অবস্থা">
              <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {["সম্পন্ন", "আংশিক", "চলছে", "শুরু হয়নি"].map((status) => <option key={status}>{status}</option>)}
              </select>
            </FormField>
            <FormField label="বোঝার মান (১–৫)">
              <select className="field" value={form.understanding || 3} onChange={(event) => setForm({ ...form, understanding: Number(event.target.value) })}>
                {[1, 2, 3, 4, 5].map((rating) => <option key={rating}>{rating}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="নোট">
            <textarea className="field min-h-16" value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </FormField>
          <div className="flex gap-2">
            <button disabled={busy} className="btn btn-primary flex-1">
              <Save size={16} /> {editingId ? "আপডেট করো" : "পড়ার হিসাব সংরক্ষণ"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="btn btn-plain">বাতিল</button>}
          </div>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-extrabold text-green-950">সাম্প্রতিক পড়ার হিসাব</h2>
        <div className="space-y-3">
          {logs.length === 0 ? <EmptyState>কোনো পড়ার লগ নেই।</EmptyState> : logs.map((item) => (
            <article key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-xs font-bold text-green-700">{item.study_date} · {item.actual_minutes} মিনিট</p>
                <p className="mt-1 text-sm font-bold">{item.topic}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {getSubjectName(subjects, item.subject_id, item.subject_name)} · {item.status} · বোঝা {item.understanding ?? "—"}/5
                </p>
                {item.notes && <p className="mt-1 text-xs text-slate-400">{item.notes}</p>}
              </div>
              <RecordActions onEdit={() => editItem(item)} onDelete={() => onDelete(item.id)} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
