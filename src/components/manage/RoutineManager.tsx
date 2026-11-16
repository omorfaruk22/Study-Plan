"use client";

import { useState, type FormEvent } from "react";
import { Save, X } from "lucide-react";
import type { RoutineInput, RoutineItem, Subject } from "@/lib/types";
import { formatTime12 } from "@/lib/time-format";
import TimeInput from "@/components/manage/TimeInput";
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

const days = ["রবিবার–বৃহস্পতিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const categories = ["কলেজ", "DUET Non-Department", "DUET Department", "Web Development", "ব্যক্তিগত", "জব"];

type RoutineManagerProps = {
  routine: RoutineItem[];
  subjects: Subject[];
  busy: boolean;
  onSave: (item: RoutineInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function createEmptyRoutine(sortOrder: number): RoutineInput {
  return {
    day: days[0], start_time: "19:00", end_time: "20:00", title: "",
    category: categories[0], subject_id: null, subject_name: null, notes: "", sort_order: sortOrder,
  };
}

export default function RoutineManager({ routine, subjects, busy, onSave, onDelete }: RoutineManagerProps) {
  const [form, setForm] = useState<RoutineInput>(() => createEmptyRoutine(1));
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyRoutine(routine.length + 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subjectName = getSubjectInputValue(subjects, form.subject_id, form.subject_name);
    const saveData: RoutineInput = {
      ...form,
      ...normalizeSubjectInput(subjects, subjectName),
    };
    const saved = await onSave(saveData, editingId || undefined);
    if (saved) resetForm();
  }

  function editItem(item: RoutineItem) {
    setEditingId(item.id);
    setForm({
      day: item.day,
      start_time: item.start_time,
      end_time: item.end_time,
      title: item.title,
      category: item.category,
      subject_id: item.subject_id || null,
      subject_name: item.subject_name || null,
      notes: item.notes || "",
      sort_order: item.sort_order,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.85fr)]">
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold text-green-950">{editingId ? "রুটিন সম্পাদনা" : "নতুন রুটিন যোগ করো"}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs font-bold text-slate-500">
              <X size={14} className="inline" /> বাতিল
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <FormField label="বার">
            <select className="field" value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })}>
              {days.map((day) => <option key={day}>{day}</option>)}
            </select>
          </FormField>
          <FormField label="ক্যাটাগরি">
            <select className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </FormField>
          <FormField label="শুরুর সময়">
            <TimeInput value={form.start_time} onChange={(value) => setForm({ ...form, start_time: value })} />
          </FormField>
          <FormField label="শেষের সময়">
            <TimeInput value={form.end_time} onChange={(value) => setForm({ ...form, end_time: value })} />
          </FormField>
          <FormField label="কাজ / পড়ার নাম" className="sm:col-span-2">
            <input required className="field" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="যেমন: Database Management পড়া" />
          </FormField>
          <FormField label="বিষয় (ঐচ্ছিক)">
            <SubjectField
              subjects={subjects}
              listId="routine-subject-suggestions"
              value={getSubjectInputValue(subjects, form.subject_id, form.subject_name)}
              optional
              onChange={(value) => setForm({ ...form, ...resolveSubjectInput(subjects, value) })}
            />
          </FormField>
          <FormField label="ক্রম">
            <input type="number" className="field" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} />
          </FormField>
          <FormField label="বিস্তারিত / নোট" className="sm:col-span-2">
            <textarea className="field min-h-20" value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </FormField>
          <button disabled={busy} className="btn btn-primary sm:col-span-2">
            <Save size={16} /> {busy ? "সংরক্ষণ হচ্ছে..." : editingId ? "আপডেট করো" : "রুটিন যোগ করো"}
          </button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-extrabold text-green-950">প্রকাশিত রুটিন ({routine.length})</h2>
        <div className="space-y-3">
          {routine.length === 0 ? <EmptyState>কোনো রুটিন নেই।</EmptyState> : routine.map((item) => (
            <article key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-green-700">{item.day} · {formatTime12(item.start_time)}–{formatTime12(item.end_time)}</span>
                <p className="mt-1 text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.category}{item.subject_id || item.subject_name ? ` · ${getSubjectName(subjects, item.subject_id, item.subject_name)}` : ""}{item.notes ? ` · ${item.notes}` : ""}
                </p>
              </div>
              <RecordActions disabled={busy} onEdit={() => editItem(item)} onDelete={() => onDelete(item.id)} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
