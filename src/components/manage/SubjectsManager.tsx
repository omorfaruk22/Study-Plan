"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import type { Subject, SubjectCategory, SubjectInput } from "@/lib/types";
import { EmptyState, FormField, RecordActions } from "@/components/manage/ManagerPrimitives";

type SubjectsManagerProps = {
  subjects: Subject[];
  category: SubjectCategory;
  busy: boolean;
  onSave: (item: SubjectInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function createEmptySubject(category: SubjectCategory): SubjectInput {
  return { name: "", category, code: null, color: null };
}

export default function SubjectsManager({ subjects, category, busy, onSave, onDelete }: SubjectsManagerProps) {
  const [form, setForm] = useState<SubjectInput>(() => createEmptySubject(category));
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setForm(createEmptySubject(category));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onSave({ ...form, category }, editingId || undefined)) resetForm();
  }

  function editItem(item: Subject) {
    setEditingId(item.id);
    setForm({ name: item.name, category, code: item.code || null, color: item.color || null });
  }

  return (
    <div className="planner-manager-grid mt-5 grid gap-5 lg:grid-cols-[minmax(280px,.7fr)_minmax(0,1.3fr)]">
      <section className="card p-3.5 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-extrabold text-green-950">{editingId ? "বিষয় সম্পাদনা" : "নিজের বিষয় যোগ করো"}</h2>
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-800">{category}</span>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <FormField label="বিষয়ের নাম">
            <input required className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="বিষয়ের নাম লিখুন" />
          </FormField>
          <FormField label="কোড (ঐচ্ছিক)">
            <input className="field" value={form.code || ""} onChange={(event) => setForm({ ...form, code: event.target.value || null })} />
          </FormField>
          <div className="flex gap-2">
            <button disabled={busy} className="btn btn-primary flex-1">
              <Save size={16} /> {editingId ? "আপডেট করো" : "বিষয় যোগ করো"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="btn btn-plain">বাতিল</button>}
          </div>
        </form>
      </section>

      <section className="card p-3.5 sm:p-5">
        <h2 className="mb-4 font-extrabold text-green-950">{category} বিষয় ({subjects.length})</h2>
        {subjects.length === 0 ? <EmptyState>এখনো কোনো বিষয় যোগ করা হয়নি। বাম পাশের ফর্ম থেকে নিজের বিষয় যোগ করো।</EmptyState> : (
          <div className="grid gap-2 sm:grid-cols-2">
            {subjects.map((item) => (
              <article key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-bold">{item.name}</p>
                  {item.code && <p className="mt-1 break-words text-[11px] text-green-700">কোড: {item.code}</p>}
                </div>
                <RecordActions disabled={busy} onEdit={() => editItem(item)} onDelete={() => onDelete(item.id)} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
