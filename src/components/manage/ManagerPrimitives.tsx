"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Subject } from "@/lib/types";

type FormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, children, className = "" }: FormFieldProps) {
  return (
    <label className={className}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

type SubjectFieldProps = {
  subjects: Subject[];
  value: string;
  listId: string;
  onChange: (value: string) => void;
  optional?: boolean;
};

export function SubjectField({ subjects, value, listId, onChange, optional = false }: SubjectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = value.trim().toLocaleLowerCase();
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLocaleLowerCase().includes(query),
  );

  function chooseSubject(name: string) {
    onChange(name);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown" && filteredSubjects.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % filteredSubjects.length);
      return;
    }

    if (event.key === "ArrowUp" && filteredSubjects.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => index <= 0 ? filteredSubjects.length - 1 : index - 1);
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      chooseSubject(filteredSubjects[activeIndex].name);
    }
  }

  return (
    <div className="relative">
      <input
        className="field"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        value={value}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setIsOpen(false);
          setActiveIndex(-1);
        }}
        placeholder={optional ? "বিষয় লিখুন (ঐচ্ছিক)" : "বিষয় লিখুন"}
        autoComplete="off"
      />

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-green-200 bg-green-50 p-1.5 shadow-lg shadow-green-950/10"
        >
          {filteredSubjects.length > 0 ? filteredSubjects.map((subject, index) => (
            <button
              id={`${listId}-option-${index}`}
              key={subject.id}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseSubject(subject.name)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                activeIndex === index
                  ? "bg-green-700 font-semibold text-white"
                  : "text-green-950 hover:bg-green-100"
              }`}
            >
              {subject.name}
            </button>
          )) : (
            <p className="px-3 py-2 text-sm text-green-800">কোনো বিষয় পাওয়া যায়নি। নিজের বিষয়টি লিখুন।</p>
          )}
        </div>
      )}
    </div>
  );
}

export function getSubjectInputValue(subjects: Subject[], subjectId?: string | null, customName?: string | null) {
  if (customName !== null && customName !== undefined) return customName;
  return subjects.find((subject) => subject.id === subjectId)?.name || "";
}

export function resolveSubjectInput(subjects: Subject[], value: string) {
  const name = value.trim();
  const existing = subjects.find((subject) => subject.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());

  return {
    subject_id: existing?.id || null,
    // Keep the exact input while typing so spaces and capitalization are not lost.
    subject_name: value || null,
  };
}

export function normalizeSubjectInput(subjects: Subject[], value: string) {
  const name = value.trim();
  const existing = subjects.find((subject) => subject.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());

  return {
    subject_id: existing?.id || null,
    subject_name: existing ? null : name || null,
  };
}

export function getSubjectName(subjects: Subject[], subjectId?: string | null, customName?: string | null) {
  return customName?.trim() || subjects.find((subject) => subject.id === subjectId)?.name || "বিষয় উল্লেখ নেই";
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-400">{children}</p>;
}

type RecordActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function RecordActions({ onEdit, onDelete, disabled = false }: RecordActionsProps) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" title="Edit" disabled={disabled} onClick={onEdit} className="rounded-lg p-2 text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50">
        <Pencil size={15} />
      </button>
      <button type="button" title="Delete" disabled={disabled} onClick={onDelete} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
