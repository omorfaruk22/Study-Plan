"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import type { StudyTask, StudyTaskInput, Subject } from "@/lib/types";
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

const taskTypes = ["Assignment", "Class Test", "Lab", "Project", "Exam", "Revision", "Other"];
const priorities = ["জরুরি", "উচ্চ", "মাঝারি", "কম"];
const statuses = ["শুরু হয়নি", "চলছে", "সম্পন্ন", "জমা হয়েছে"];

type TasksManagerProps = {
  tasks: StudyTask[];
  subjects: Subject[];
  busy: boolean;
  onSave: (item: StudyTaskInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function createEmptyTask(): StudyTaskInput {
  return {
    title: "", subject_id: null, subject_name: null, task_type: "Assignment", due_date: null,
    priority: "মাঝারি", status: "শুরু হয়নি", notes: "",
  };
}

export default function TasksManager({ tasks, subjects, busy, onSave, onDelete }: TasksManagerProps) {
  const [form, setForm] = useState<StudyTaskInput>(createEmptyTask);
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyTask());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subjectName = getSubjectInputValue(subjects, form.subject_id, form.subject_name);
    const saveData: StudyTaskInput = {
      ...form,
      ...normalizeSubjectInput(subjects, subjectName),
    };
    if (await onSave(saveData, editingId || undefined)) resetForm();
  }

  function editItem(item: StudyTask) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      subject_id: item.subject_id || null,
      subject_name: item.subject_name || null,
      task_type: item.task_type,
      due_date: item.due_date || null,
      priority: item.priority,
      status: item.status,
      notes: item.notes || "",
    });
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)]">
      <section className="card p-5">
        <h2 className="mb-4 font-extrabold text-green-950">{editingId ? "কাজ সম্পাদনা" : "নতুন Assignment / পরীক্ষা"}</h2>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <FormField label="কাজের নাম">
            <input required className="field" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </FormField>
          <FormField label="বিষয়">
            <SubjectField
              subjects={subjects}
              listId="task-subject-suggestions"
              value={getSubjectInputValue(subjects, form.subject_id, form.subject_name)}
              optional
              onChange={(value) => setForm({ ...form, ...resolveSubjectInput(subjects, value) })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="ধরন">
              <select className="field" value={form.task_type} onChange={(event) => setForm({ ...form, task_type: event.target.value })}>
                {taskTypes.map((taskType) => <option key={taskType}>{taskType}</option>)}
              </select>
            </FormField>
            <FormField label="ডেডলাইন">
              <input type="date" className="field" value={form.due_date || ""} onChange={(event) => setForm({ ...form, due_date: event.target.value || null })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="অগ্রাধিকার">
              <select className="field" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                {priorities.map((priority) => <option key={priority}>{priority}</option>)}
              </select>
            </FormField>
            <FormField label="অবস্থা">
              <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="নোট">
            <textarea className="field min-h-16" value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </FormField>
          <div className="flex gap-2">
            <button disabled={busy} className="btn btn-primary flex-1">
              <Save size={16} /> {editingId ? "আপডেট করো" : "কাজ যোগ করো"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="btn btn-plain">বাতিল</button>}
          </div>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-extrabold text-green-950">Assignment ও পরীক্ষা</h2>
        <div className="space-y-3">
          {tasks.length === 0 ? <EmptyState>কোনো কাজ যোগ করা হয়নি।</EmptyState> : tasks.map((item) => (
            <article key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.task_type} · {getSubjectName(subjects, item.subject_id, item.subject_name)} · ডেডলাইন: {item.due_date || "নেই"}
                </p>
                <div className="mt-2 flex gap-2 text-[10px]">
                  <span className="rounded bg-amber-50 px-2 py-1 font-bold text-amber-700">{item.priority}</span>
                  <span className="rounded bg-green-50 px-2 py-1 font-bold text-green-700">{item.status}</span>
                </div>
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
