import type { StudyTrack } from "@/lib/types";

type StudyRecordLike = {
  [key: string]: unknown;
  study_track?: unknown;
  studyTrack?: unknown;
  track?: unknown;
  category?: unknown;
  study_category?: unknown;
  subject_category?: unknown;
  subject_id?: unknown;
  subject_name?: unknown;
};

type SubjectLike = {
  id?: unknown;
  _id?: unknown;
  name?: unknown;
  category?: unknown;
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function normalizedText(value: unknown) {
  return textValue(value)
    .toLocaleLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[_\s-]+/g, " ");
}

export function isStudyTrack(value: unknown): value is StudyTrack {
  return value === "academic" || value === "duet_department" || value === "duet_non_department";
}

/**
 * Maps the category labels used by existing planner records to a canonical
 * track. This is deliberately read-only: legacy records remain untouched in
 * MongoDB while every persisted record stays visible in the current UI.
 */
export function studyTrackFromCategory(value: unknown): StudyTrack | null {
  if (isStudyTrack(value)) return value;

  const category = normalizedText(value);
  if (!category) return null;

  if (
    category === "academic" ||
    category === "college" ||
    category === "web development" ||
    category === "webdevelopment" ||
    category === "কলেজ"
  ) {
    return "academic";
  }

  if (category.includes("duet") && (category.includes("non") || category.includes("নন"))) {
    return "duet_non_department";
  }

  if (category.includes("duet") && category.includes("department")) {
    return "duet_department";
  }

  return null;
}

export function getSubjectStudyTrack(subject: SubjectLike) {
  return studyTrackFromCategory(subject.category);
}

function recordTrack(entry: StudyRecordLike) {
  const values = [
    entry.study_track,
    entry.studyTrack,
    entry.track,
    entry.category,
    entry.study_category,
    entry.subject_category,
  ];

  for (const value of values) {
    const track = studyTrackFromCategory(value);
    if (track) return track;
  }

  return null;
}

function subjectIdentifier(subject: SubjectLike) {
  return textValue(subject.id || subject._id);
}

function matchingSubjectTrack(subjects: readonly SubjectLike[], subjectName: string) {
  const normalizedName = normalizedText(subjectName);
  if (!normalizedName) return null;

  const matchedTracks = new Set<StudyTrack>();
  for (const subject of subjects) {
    if (normalizedText(subject.name) !== normalizedName) continue;
    const track = getSubjectStudyTrack(subject);
    if (track) matchedTracks.add(track);
  }

  // A duplicate subject name can legitimately exist in different tracks. Do
  // not guess in that case; the original record still remains in total time.
  return matchedTracks.size === 1 ? [...matchedTracks][0] : null;
}

/**
 * Resolves the track for current records and older records that only kept a
 * subject/category reference. Unknown data is intentionally left unassigned
 * rather than being fabricated into a study track.
 */
export function resolveStudyTrack(entry: StudyRecordLike, subjects: readonly SubjectLike[] = []): StudyTrack | null {
  const directTrack = recordTrack(entry);
  if (directTrack) return directTrack;

  const subjectId = textValue(entry.subject_id);
  if (subjectId) {
    const subject = subjects.find((item) => subjectIdentifier(item) === subjectId);
    const subjectTrack = subject ? getSubjectStudyTrack(subject) : null;
    if (subjectTrack) return subjectTrack;
  }

  return matchingSubjectTrack(subjects, textValue(entry.subject_name));
}

/** Adds a derived track only to the response object; it never updates MongoDB. */
export function withResolvedStudyTrack<T extends StudyRecordLike>(entry: T, subjects: readonly SubjectLike[] = []): T {
  if (isStudyTrack(entry.study_track)) return entry;
  const studyTrack = resolveStudyTrack(entry, subjects);
  return studyTrack ? { ...entry, study_track: studyTrack } : entry;
}
