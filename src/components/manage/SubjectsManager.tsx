"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import type { Subject, SubjectInput } from "@/lib/types";
import { EmptyState, FormField, RecordActions } from "@/components/manage/ManagerPrimitives";

const categories = ["কলেজ", "DUET Non-Department", "DUET Department", "Web Development"];

type SubjectsManagerProps = {
  subjects: Subject[];
  busy: boolean;
  onSave: (item: SubjectInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function createEmptySubject(): SubjectInput {
  return { name: "", category: "কলেজ", code: null, color: null };
}

export default function SubjectsManager({ subjects, busy, onSave, onDelete }: SubjectsManagerProps) {
  const [form, setForm] = useState<SubjectInput>(createEmptySubject);
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setForm(createEmptySubject());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onSave(form, editingId || undefined)) resetForm();
  }

  function editItem(item: Subject) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      code: item.code || null,
      color: item.color || null,
    });
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,.7fr)_minmax(0,1.3fr)]">
      <section className="card p-5">
        <h2 className="mb-4 font-extrabold text-green-950">{editingId ? "বিষয় সম্পাদনা" : "নতুন বিষয় যোগ করো"}</h2>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <FormField label="বিষয়ের নাম">
            <input required className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </FormField>
          <FormField label="ক্যাটাগরি">
            <select className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
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

      <section className="card p-5">
        <h2 className="mb-4 font-extrabold text-green-950">সব বিষয় ({subjects.length})</h2>
        {subjects.length === 0 ? <EmptyState>কোনো বিষয় যোগ করা হয়নি।</EmptyState> : (
          <div className="grid gap-2 sm:grid-cols-2">
            {subjects.map((item) => (
              <article key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="mt-1 text-[11px] text-green-700">{item.category}{item.code ? ` · ${item.code}` : ""}</p>
                </div>
                <RecordActions onEdit={() => editItem(item)} onDelete={() => onDelete(item.id)} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
