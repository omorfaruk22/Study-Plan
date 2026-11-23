export const ownerFields = {
  weekly_routine: ["day", "start_time", "end_time", "title", "subject_id", "subject_name", "category", "notes", "sort_order"],
  study_logs: ["study_date", "subject_id", "subject_name", "study_track", "topic", "planned_minutes", "actual_minutes", "status", "understanding", "notes", "review_due_date", "last_reviewed_date"],
  study_tasks: ["title", "subject_id", "subject_name", "task_type", "due_date", "priority", "status", "notes"],
  subjects: ["name", "category", "code", "color"],
} as const;

export type OwnerCollection = keyof typeof ownerFields;
export type OwnerRecord = Record<string, unknown>;

const requiredFields: Record<OwnerCollection, readonly string[]> = {
  weekly_routine: ["day", "start_time", "end_time", "title", "category"],
  study_logs: ["study_date", "topic"],
  study_tasks: ["title"],
  subjects: ["name", "category"],
};

const stringFields: Record<OwnerCollection, readonly string[]> = {
  weekly_routine: ["day", "start_time", "end_time", "title", "category"],
  study_logs: ["study_date", "topic", "status"],
  study_tasks: ["title", "task_type", "priority", "status"],
  subjects: ["name", "category"],
};

const nullableStringFields: Record<OwnerCollection, readonly string[]> = {
  weekly_routine: ["subject_id", "subject_name", "notes"],
  study_logs: ["subject_id", "subject_name", "notes", "review_due_date", "last_reviewed_date"],
  study_tasks: ["subject_id", "subject_name", "due_date", "notes"],
  subjects: ["code", "color"],
};

const dateFields: Partial<Record<OwnerCollection, readonly string[]>> = {
  study_logs: ["study_date", "review_due_date", "last_reviewed_date"],
  study_tasks: ["due_date"],
};

const numericFields: Partial<Record<OwnerCollection, Record<string, { min: number; max?: number; nullable?: boolean }>>> = {
  weekly_routine: { sort_order: { min: Number.MIN_SAFE_INTEGER } },
  study_logs: {
    planned_minutes: { min: 0 },
    actual_minutes: { min: 0 },
    understanding: { min: 1, max: 5, nullable: true },
  },
};

const studyTracks = new Set(["academic", "duet_department", "duet_non_department"]);

function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function pickOwnerRecord(input: unknown, collection: OwnerCollection): OwnerRecord | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const source = input as OwnerRecord;
  const result: OwnerRecord = {};
  for (const key of ownerFields[collection]) {
    if (Object.prototype.hasOwnProperty.call(source, key)) result[key] = source[key];
  }
  return result;
}

export function validateOwnerRecord(collection: OwnerCollection, data: OwnerRecord, requireRequired = false): string | null {
  const required = requiredFields[collection];
  if (requireRequired && required.some((key) => typeof data[key] !== "string" || !(data[key] as string).trim())) {
    return "প্রয়োজনীয় তথ্য পূরণ করো।";
  }
  if (!Object.keys(data).length) return "আপডেট করার মতো কোনো তথ্য নেই।";

  for (const [key, value] of Object.entries(data)) {
    if ((stringFields[collection] as readonly string[]).includes(key)) {
      if (typeof value !== "string" || !value.trim()) return "তথ্যের ধরন বা মান সঠিক নয়।";
      if ((dateFields[collection] || []).includes(key) && !isDateKey(value)) return "তারিখের format সঠিক নয়।";
      continue;
    }

    if ((nullableStringFields[collection] as readonly string[]).includes(key)) {
      if (value !== null && (typeof value !== "string" || ((dateFields[collection] || []).includes(key) && !isDateKey(value)))) {
        return "তথ্যের ধরন বা মান সঠিক নয়।";
      }
      continue;
    }

    if (collection === "study_logs" && key === "study_track") {
      if (value !== null && (typeof value !== "string" || !studyTracks.has(value))) return "পড়ার বিভাগের মান সঠিক নয়.";
      continue;
    }

    const numericRule = numericFields[collection]?.[key];
    if (numericRule) {
      if (value === null && numericRule.nullable) continue;
      if (typeof value !== "number" || !Number.isSafeInteger(value) || value < numericRule.min || (numericRule.max !== undefined && value > numericRule.max)) {
        return "সংখ্যার মান সঠিক নয়।";
      }
    }
  }

  return null;
}
