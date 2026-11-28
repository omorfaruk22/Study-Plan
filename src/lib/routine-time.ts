import { formatTime12, parseTimeInput } from "@/lib/time-format";

export const WEEKDAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"] as const;

const englishWeekdays: Record<string, (typeof WEEKDAYS)[number]> = {
  Sunday: "রবিবার",
  Monday: "সোমবার",
  Tuesday: "মঙ্গলবার",
  Wednesday: "বুধবার",
  Thursday: "বৃহস্পতিবার",
  Friday: "শুক্রবার",
  Saturday: "শনিবার",
};

const weekdayAliases: Record<string, (typeof WEEKDAYS)[number]> = {
  "রবিবার": "রবিবার", "রবি": "রবিবার", sunday: "রবিবার", sun: "রবিবার",
  "সোমবার": "সোমবার", "সোম": "সোমবার", monday: "সোমবার", mon: "সোমবার",
  "মঙ্গলবার": "মঙ্গলবার", "মঙ্গল": "মঙ্গলবার", tuesday: "মঙ্গলবার", tue: "মঙ্গলবার", tues: "মঙ্গলবার",
  "বুধবার": "বুধবার", "বুধ": "বুধবার", wednesday: "বুধবার", wed: "বুধবার",
  "বৃহস্পতিবার": "বৃহস্পতিবার", "বৃহঃ": "বৃহস্পতিবার", "বৃহ": "বৃহস্পতিবার", thursday: "বৃহস্পতিবার", thu: "বৃহস্পতিবার", thur: "বৃহস্পতিবার", thurs: "বৃহস্পতিবার",
  "শুক্রবার": "শুক্রবার", "শুক্র": "শুক্রবার", friday: "শুক্রবার", fri: "শুক্রবার",
  "শনিবার": "শনিবার", "শনি": "শনিবার", saturday: "শনিবার", sat: "শনিবার",
};

export type DhakaRoutineClock = {
  day: (typeof WEEKDAYS)[number];
  minutes: number;
  timeLabel: string;
  dateLabel: string;
};

export function getDhakaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function dateFromDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function addDaysToDateKey(value: string, days: number) {
  const date = dateFromDateKey(value);
  if (!date || !Number.isFinite(days)) return value;
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return date.toISOString().slice(0, 10);
}

export function getDhakaRoutineClock(date = new Date()): DhakaRoutineClock {
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
  }).format(date);
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(timeParts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(timeParts.find((part) => part.type === "minute")?.value || 0);

  return {
    day: englishWeekdays[weekdayName] || "রবিবার",
    minutes: hour * 60 + minute,
    timeLabel: new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date),
    dateLabel: new Intl.DateTimeFormat("bn-BD", {
      timeZone: "Asia/Dhaka",
      day: "numeric",
      month: "long",
    }).format(date),
  };
}

export function routineTimeToMinutes(value: string): number | null {
  const normalized = parseTimeInput(value).trim();
  const match = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function getDhakaWeekdayForDateKey(dateKey: string) {
  const date = dateFromDateKey(dateKey);
  return date ? getDhakaRoutineClock(date).day : null;
}

function canonicalWeekday(value: string) {
  return weekdayAliases[value.trim().toLocaleLowerCase().replace(/\s+/g, "")] || null;
}

function isWithinWeekdayRange(weekday: (typeof WEEKDAYS)[number], start: (typeof WEEKDAYS)[number], end: (typeof WEEKDAYS)[number]) {
  const targetIndex = WEEKDAYS.indexOf(weekday);
  const startIndex = WEEKDAYS.indexOf(start);
  const endIndex = WEEKDAYS.indexOf(end);
  return startIndex <= endIndex
    ? targetIndex >= startIndex && targetIndex <= endIndex
    : targetIndex >= startIndex || targetIndex <= endIndex;
}

export function routineMatchesDay(scheduleDay: string, weekday: string): boolean {
  const target = canonicalWeekday(weekday);
  if (!target) return false;

  const normalized = scheduleDay.trim().replace(/[–—]/g, "-").replace(/\s+/g, "");
  const lowerCase = normalized.toLocaleLowerCase();
  if (["প্রতিদিন", "সবদিন", "everyday", "daily", "all"].includes(lowerCase)) return true;

  const range = lowerCase.split("-");
  if (range.length === 2) {
    const [start, end] = range.map(canonicalWeekday);
    if (start && end) return isWithinWeekdayRange(target, start, end);
  }

  return lowerCase.split(/[,/|+&]/).some((day) => canonicalWeekday(day) === target);
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime12(start)} – ${formatTime12(end)}`;
}
