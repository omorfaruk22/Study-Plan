"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { BookOpenCheck, CalendarDays, ClipboardList, FilePenLine, Pencil, Search, StickyNote } from "lucide-react";
import { FormField } from "@/components/manage/ManagerPrimitives";
import { formatTime12 } from "@/lib/time-format";
import type { RoutineItem, StudyLog, StudyTask } from "@/lib/types";

type NoteCollection = "weekly_routine" | "study_logs" | "study_tasks";
type NoteFilter = "all" | NoteCollection;

type SourceRecord = {
  id: string;
  label: string;
  context: string;
  currentNote: string;
};

type NoteEntry = SourceRecord & {
  collection: NoteCollection;
  sourceLabel: string;
  href: string;
};

type NotesWorkspaceProps = {
  routine: RoutineItem[];
  logs: StudyLog[];
  tasks: StudyTask[];
  busy: boolean;
  onSaveNote: (collection: NoteCollection, id: string, note: string) => Promise<boolean>;
};

const sourceLabels: Record<NoteCollection, string> = {
  study_logs: "পড়ার হিসাব",
  study_tasks: "কাজ ও ডেডলাইন",
  weekly_routine: "রুটিন",
};

const sourceLinks: Record<NoteCollection, string> = {
  study_logs: "/manage/academic",
  study_tasks: "/manage/tasks",
  weekly_routine: "/manage/routine",
};

const filters: { id: NoteFilter; label: string }[] = [
  { id: "all", label: "সব নোট" },
  { id: "study_logs", label: "পড়ার হিসাব" },
  { id: "study_tasks", label: "কাজ" },
  { id: "weekly_routine", label: "রুটিন" },
];

function noteValue(value: string | null | undefined) {
  return value?.trim() || "";
}

function SourceIcon({ collection, size = 17 }: { collection: NoteCollection; size?: number }) {
  if (collection === "study_logs") return <BookOpenCheck size={size} />;
  if (collection === "study_tasks") return <ClipboardList size={size} />;
  return <CalendarDays size={size} />;
}

export default function NotesWorkspace({ routine, logs, tasks, busy, onSaveNote }: NotesWorkspaceProps) {
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<NoteCollection>("study_logs");
  const [selectedId, setSelectedId] = useState("");
  const [noteText, setNoteText] = useState("");
  const composerRef = useRef<HTMLElement>(null);

  const recordsByCollection = useMemo<Record<NoteCollection, SourceRecord[]>>(() => ({
    study_logs: logs.map((log) => ({
      id: log.id,
      label: log.topic,
      context: `${log.study_date} · ${log.actual_minutes} মিনিট`,
      currentNote: noteValue(log.notes),
    })),
    study_tasks: tasks.map((task) => ({
      id: task.id,
      label: task.title,
      context: `${task.task_type}${task.due_date ? ` · ডেডলাইন ${task.due_date}` : ""}`,
      currentNote: noteValue(task.notes),
    })),
    weekly_routine: routine.map((item) => ({
      id: item.id,
      label: item.title,
      context: `${item.day} · ${formatTime12(item.start_time)}–${formatTime12(item.end_time)}`,
      currentNote: noteValue(item.notes),
    })),
  }), [logs, routine, tasks]);

  const notes = useMemo<NoteEntry[]>(() => {
    const fromSource = (collection: NoteCollection): NoteEntry[] => recordsByCollection[collection]
      .filter((record) => Boolean(record.currentNote))
      .map((record) => ({
        ...record,
        collection,
        sourceLabel: sourceLabels[collection],
        href: sourceLinks[collection],
      }));

    return [
      ...fromSource("study_logs"),
      ...fromSource("study_tasks"),
      ...fromSource("weekly_routine"),
    ];
  }, [recordsByCollection]);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleNotes = notes.filter((note) => {
    if (filter !== "all" && note.collection !== filter) return false;
    if (!normalizedQuery) return true;
    return [note.label, note.context, note.currentNote, note.sourceLabel]
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
  });

  const selectedRecords = recordsByCollection[selectedCollection];
  const selectedRecord = selectedRecords.find((record) => record.id === selectedId);
  const hasAnySourceRecord = Object.values(recordsByCollection).some((records) => records.length > 0);

  function chooseCollection(collection: NoteCollection) {
    setSelectedCollection(collection);
    setSelectedId("");
    setNoteText("");
  }

  function chooseRecord(id: string) {
    setSelectedId(id);
    setNoteText(recordsByCollection[selectedCollection].find((record) => record.id === id)?.currentNote || "");
  }

  function editNote(note: NoteEntry) {
    setSelectedCollection(note.collection);
    setSelectedId(note.id);
    setNoteText(note.currentNote);
    window.requestAnimationFrame(() => composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = noteText.trim();
    if (!selectedRecord || !value) return;
    if (await onSaveNote(selectedCollection, selectedRecord.id, value)) {
      setSelectedId("");
      setNoteText("");
    }
  }

  return (
    <section className="planner-manager planner-notes-workspace mt-5">
      <header className="planner-manager-hero planner-notes-hero rounded-2xl border border-green-100 bg-green-50/70 p-3.5 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-green-700"><StickyNote size={21} /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-green-700">Study notes</p>
            <h2 className="text-xl font-extrabold text-green-950">তোমার নোট</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">পড়ার হিসাব, কাজ ও রুটিনে রাখা live নোটগুলো এক জায়গায় দেখো ও সম্পাদনা করো।</p>
        <span className="planner-notes-count"><StickyNote size={14} /> {notes.length}টি সংরক্ষিত নোট</span>
      </header>

      <div className="planner-notes-grid mt-5">
        <section ref={composerRef} className="card planner-note-composer p-3.5 sm:p-5">
          <div className="planner-note-card-heading">
            <span><FilePenLine size={18} /></span>
            <div>
              <p>নোট লিখো বা আপডেট করো</p>
              <small>একটি বিদ্যমান পড়া, কাজ বা রুটিন বেছে নাও।</small>
            </div>
          </div>

          {hasAnySourceRecord ? (
            <form onSubmit={saveNote} className="mt-5 grid gap-3">
              <FormField label="নোটের ধরন">
                <select className="field" value={selectedCollection} onChange={(event) => chooseCollection(event.target.value as NoteCollection)}>
                  <option value="study_logs">পড়ার হিসাব</option>
                  <option value="study_tasks">কাজ ও ডেডলাইন</option>
                  <option value="weekly_routine">রুটিন</option>
                </select>
              </FormField>
              <FormField label="কোন তথ্যের সাথে নোটটি থাকবে">
                <select className="field" value={selectedId} onChange={(event) => chooseRecord(event.target.value)} disabled={selectedRecords.length === 0} required>
                  <option value="">{selectedRecords.length > 0 ? "একটি তথ্য বেছে নাও" : `কোনো ${sourceLabels[selectedCollection]} নেই`}</option>
                  {selectedRecords.map((record) => (
                    <option key={record.id} value={record.id}>{record.label} · {record.context}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="নোট">
                <textarea
                  required
                  className="field min-h-28"
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder="মনে রাখার মতো তথ্য লিখো..."
                  disabled={!selectedRecord}
                />
              </FormField>
              <p className="planner-note-helper">নোটটি শুধু নির্বাচিত তথ্যের সাথেই সংরক্ষিত হবে—নতুন পড়ার সময়, কাজ বা রুটিন তৈরি হবে না।</p>
              <div className="flex gap-2">
                <button disabled={busy || !selectedRecord || !noteText.trim()} className="btn btn-primary flex-1">
                  <FilePenLine size={16} /> {busy ? "সংরক্ষণ হচ্ছে..." : selectedRecord?.currentNote ? "নোট আপডেট করো" : "নোট সংরক্ষণ করো"}
                </button>
                {(selectedId || noteText) && <button type="button" className="btn btn-plain" onClick={() => { setSelectedId(""); setNoteText(""); }}>বাতিল</button>}
              </div>
            </form>
          ) : (
            <div className="planner-note-empty composer-empty">
              <StickyNote size={25} />
              <strong>নোট রাখার মতো কোনো তথ্য নেই</strong>
              <span>আগে পড়ার হিসাব, কাজ অথবা রুটিন যোগ করো। তারপর তার সাথেই নোটটি নিরাপদে রাখা যাবে।</span>
              <div>
                <Link href="/manage/academic">পড়ার হিসাব</Link>
                <Link href="/manage/tasks">কাজ</Link>
                <Link href="/manage/routine">রুটিন</Link>
              </div>
            </div>
          )}
        </section>

        <section className="card planner-notes-list-card p-3.5 sm:p-5">
          <div className="planner-note-list-header">
            <div>
              <p>সংরক্ষিত নোট</p>
              <small>{notes.length ? `${notes.length}টি live নোট পাওয়া গেছে` : "এখনো কোনো live নোট নেই"}</small>
            </div>
            <span>{visibleNotes.length}</span>
          </div>

          <div className="planner-note-filters" role="group" aria-label="নোটের ধরন বেছে নাও">
            {filters.map((item) => (
              <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>
            ))}
          </div>

          <label className="planner-note-search">
            <Search size={16} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="নোটে খুঁজো..." aria-label="নোটে খুঁজো" />
          </label>

          {visibleNotes.length > 0 ? (
            <div className="planner-note-list">
              {visibleNotes.map((note) => (
                <article key={`${note.collection}-${note.id}`} className={`planner-note-item note-source-${note.collection}`}>
                  <span className="planner-note-source-icon"><SourceIcon collection={note.collection} /></span>
                  <div className="min-w-0">
                    <div className="planner-note-item-title"><strong>{note.label}</strong><small>{note.sourceLabel}</small></div>
                    <p className="planner-note-context">{note.context}</p>
                    <p className="planner-note-value">{note.currentNote}</p>
                    <div className="planner-note-actions">
                      <Link href={note.href}>মূল তথ্য দেখো</Link>
                      <button type="button" onClick={() => editNote(note)}><Pencil size={13} /> সম্পাদনা</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="planner-note-empty">
              <StickyNote size={27} />
              <strong>{notes.length ? "এই খোঁজে কোনো নোট পাওয়া যায়নি" : "এখনো কোনো নোট সংরক্ষণ করা হয়নি"}</strong>
              <span>{notes.length ? "অন্য শব্দ বা নোটের ধরন বেছে দেখো।" : "বাম পাশের ফর্ম থেকে বিদ্যমান পড়ার হিসাব, কাজ বা রুটিনের সাথে একটি নোট যোগ করো।"}</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
