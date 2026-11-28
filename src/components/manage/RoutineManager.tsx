"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, GraduationCap, Save, X } from "lucide-react";
import type { RoutineInput, RoutineItem, Subject } from "@/lib/types";
import { formatTime12 } from "@/lib/time-format";
import { getDhakaRoutineClock, routineMatchesDay, routineTimeToMinutes, WEEKDAYS } from "@/lib/routine-time";
import CurrentRoutinePanel from "@/components/manage/CurrentRoutinePanel";
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

const days = ["রবিবার–বৃহস্পতিবার", ...WEEKDAYS];
const categories = ["কলেজ", "DUET Non-Department", "DUET Department", "Web Development", "ব্যক্তিগত", "জব"];
const classRoutineCategory = "ক্লাস রুটিন";
const shortDays = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

type RoutineFilter = "today" | "all" | (typeof WEEKDAYS)[number];
type RoutineEntryMode = "routine" | "class";

type RoutineManagerProps = {
  routine: RoutineItem[];
  subjects: Subject[];
  busy: boolean;
  onSave: (item: RoutineInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
};

function createEmptyRoutine(sortOrder: number, category = categories[0]): RoutineInput {
  return {
    day: days[0], start_time: "19:00", end_time: "20:00", title: "",
    category, subject_id: null, subject_name: null, notes: "", sort_order: sortOrder,
  };
}

function getRoutineDayOrder(day: string) {
  if (day.includes("রবিবার") && day.includes("বৃহস্পতিবার")) return -1;
  const index = WEEKDAYS.findIndex((weekday) => day.includes(weekday));
  return index < 0 ? WEEKDAYS.length : index;
}

export default function RoutineManager({ routine, subjects, busy, onSave, onDelete }: RoutineManagerProps) {
  const [form, setForm] = useState<RoutineInput>(() => createEmptyRoutine(1));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<RoutineEntryMode>("routine");
  const [selectedDay, setSelectedDay] = useState<RoutineFilter>("today");
  const [today, setToday] = useState(() => getDhakaRoutineClock().day);

  useEffect(() => {
    const updateDay = () => setToday(getDhakaRoutineClock().day);
    updateDay();
    const intervalId = window.setInterval(updateDay, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyRoutine(routine.length + 1, entryMode === "class" ? classRoutineCategory : categories[0]));
  }

  function changeEntryMode(mode: RoutineEntryMode) {
    if (editingId) return;
    setEntryMode(mode);
    setForm((current) => ({ ...current, category: mode === "class" ? classRoutineCategory : categories[0] }));
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
    setEntryMode(item.category === classRoutineCategory ? "class" : "routine");
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

  const modeRoutine = routine.filter((item) => entryMode === "class"
    ? item.category === classRoutineCategory
    : item.category !== classRoutineCategory);

  const visibleRoutine = modeRoutine
    .filter((item) => {
      if (selectedDay === "all") return true;
      return routineMatchesDay(item.day, selectedDay === "today" ? today : selectedDay);
    })
    .sort((a, b) => {
      if (selectedDay === "all") {
        const dayDifference = getRoutineDayOrder(a.day) - getRoutineDayOrder(b.day);
        if (dayDifference !== 0) return dayDifference;
      }
      const aStart = routineTimeToMinutes(a.start_time);
      const bStart = routineTimeToMinutes(b.start_time);
      if (aStart !== null && bStart !== null) return aStart - bStart;
      return a.sort_order - b.sort_order;
    });

  const filters: { id: RoutineFilter; label: string }[] = [
    { id: "today", label: `আজ · ${today}` },
    { id: "all", label: "সব দিন" },
    ...WEEKDAYS.map((day, index) => ({ id: day, label: shortDays[index] })),
  ];

  return (
    <div className="planner-manager planner-manager-routine mt-5 space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="card relative overflow-visible p-3.5 sm:p-5">
          <div className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r from-green-500 via-lime-400 to-emerald-500" />
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-green-600">Routine planner</p>
              <h2 className="mt-1 text-lg font-extrabold text-green-950">{editingId ? entryMode === "class" ? "ক্লাস রুটিন সম্পাদনা" : "রুটিন সম্পাদনা" : entryMode === "class" ? "ক্লাস রুটিন যোগ করো" : "নতুন রুটিন যোগ করো"}</h2>
              <p className="mt-1 text-xs text-slate-500">সময়, দিন ও বিষয় এক জায়গায় সাজাও।</p>
            </div>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn btn-plain px-2.5 py-2 text-xs">
                <X size={14} /> বাতিল
              </button>
            )}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-50 p-1.5" role="tablist" aria-label="রুটিনের ধরন">
            <button
              type="button"
              role="tab"
              aria-selected={entryMode === "routine"}
              disabled={Boolean(editingId)}
              onClick={() => changeEntryMode("routine")}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm ${entryMode === "routine" ? "bg-green-700 text-white" : "text-slate-500 hover:bg-white"} disabled:opacity-50`}
            >সাধারণ রুটিন</button>
            <button
              type="button"
              role="tab"
              aria-selected={entryMode === "class"}
              disabled={Boolean(editingId)}
              onClick={() => changeEntryMode("class")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition sm:text-sm ${entryMode === "class" ? "bg-green-700 text-white" : "text-slate-500 hover:bg-white"} disabled:opacity-50`}
            ><GraduationCap size={15} /> ক্লাস রুটিন</button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3 min-[520px]:grid-cols-2">
            <FormField label={entryMode === "class" ? "ক্লাসের দিন" : "বার"}>
              <select className="field" value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })}>
                {days.map((day) => <option key={day}>{day}</option>)}
              </select>
            </FormField>
            {entryMode === "routine" && <FormField label="ক্যাটাগরি">
              <select className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </FormField>}
            <FormField label="শুরুর সময়">
              <TimeInput value={form.start_time} onChange={(value) => setForm({ ...form, start_time: value })} />
            </FormField>
            <FormField label="শেষের সময়">
              <TimeInput value={form.end_time} onChange={(value) => setForm({ ...form, end_time: value })} />
            </FormField>
            <FormField label={entryMode === "class" ? "ক্লাস / কোর্সের নাম" : "কাজ / পড়ার নাম"} className="min-[520px]:col-span-2">
              <input required className="field" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={entryMode === "class" ? "যেমন: Mathematics ক্লাস" : "যেমন: Database Management পড়া"} />
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
            <FormField label={entryMode === "class" ? "রুম / শিক্ষক / নোট" : "বিস্তারিত / নোট"} className="min-[520px]:col-span-2">
              <textarea className="field min-h-20" value={form.notes || ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={entryMode === "class" ? "রুম নম্বর, শিক্ষক বা অন্য তথ্য" : "এই সময়ের জন্য ছোট কোনো নোট..."} />
            </FormField>
            <button disabled={busy} className="btn btn-primary min-[520px]:col-span-2">
              <Save size={16} /> {busy ? "সংরক্ষণ হচ্ছে..." : editingId ? "আপডেট করো" : entryMode === "class" ? "ক্লাস যোগ করো" : "রুটিন যোগ করো"}
            </button>
          </form>
        </section>

        <CurrentRoutinePanel routine={routine} subjects={subjects} />
      </div>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-green-600">{entryMode === "class" ? "Class routine" : "Your schedule"}</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-extrabold text-green-950">
              {entryMode === "class" ? <GraduationCap size={19} className="text-green-500" /> : <CalendarDays size={19} className="text-green-500" />} {entryMode === "class" ? "ক্লাসের সময়সূচি" : "সাপ্তাহিক রুটিন"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">দিন বেছে নাও; সব দিনের তালিকা ছোট কার্ডে গুছানো আছে।</p>
          </div>
          <span className="w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-600">
            {visibleRoutine.length} / {modeRoutine.length} {entryMode === "class" ? "টি ক্লাস" : "টি রুটিন"}
          </span>
        </div>

        <div className="mobile-tab-scroll mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="রুটিনের দিন বেছে নিন">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={selectedDay === id}
              onClick={() => setSelectedDay(id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${selectedDay === id ? "border-green-500 bg-green-500 text-green-950 shadow-sm shadow-green-900/15" : "border-slate-200 bg-white/5 text-slate-500 hover:border-green-500/40 hover:text-green-500"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleRoutine.length === 0 ? <div className="sm:col-span-2 xl:col-span-3"><EmptyState>{entryMode === "class" ? "এই দিনের জন্য কোনো ক্লাস নেই।" : "এই দিনের জন্য কোনো রুটিন নেই।"}</EmptyState></div> : visibleRoutine.map((item) => (
            <article key={item.id} className="group flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-100 bg-white/5 p-2.5 transition hover:border-green-500/30 hover:bg-green-500/5 sm:gap-3 sm:p-3">
              <div className="flex w-[76px] shrink-0 flex-col items-center justify-center rounded-xl border border-green-500/15 bg-green-500/10 px-1.5 py-2 text-center text-green-600">
                <span className="whitespace-nowrap text-[10px] font-extrabold tabular-nums">{formatTime12(item.start_time)}</span>
                <span className="my-0.5 text-[9px] opacity-50">থেকে</span>
                <span className="whitespace-nowrap text-[10px] font-extrabold tabular-nums">{formatTime12(item.end_time)}</span>
              </div>
              <div className="min-w-0 flex-1">
                {selectedDay === "all" && <p className="mb-0.5 truncate text-[10px] font-bold text-green-600">{item.day}</p>}
                <p className="line-clamp-2 text-xs font-bold leading-relaxed text-slate-800 sm:text-sm">{item.title}</p>
                <p className="mt-1 truncate text-[10px] text-slate-500 sm:text-[11px]">
                  {item.category}{item.subject_id || item.subject_name ? ` · ${getSubjectName(subjects, item.subject_id, item.subject_name)}` : ""}
                </p>
                {item.notes && <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">{item.notes}</p>}
              </div>
              <RecordActions disabled={busy} onEdit={() => editItem(item)} onDelete={() => onDelete(item.id)} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
