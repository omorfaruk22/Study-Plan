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

export type DhakaRoutineClock = {
  day: (typeof WEEKDAYS)[number];
  minutes: number;
  timeLabel: string;
  dateLabel: string;
};

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

export function routineMatchesDay(scheduleDay: string, weekday: string): boolean {
  const normalized = scheduleDay.trim().replace(/[–—]/g, "-").replace(/\s+/g, "");
  if (normalized === "প্রতিদিন" || normalized === "সবদিন") return true;
  if (normalized === "রবিবার-বৃহস্পতিবার") {
    return WEEKDAYS.indexOf(weekday as (typeof WEEKDAYS)[number]) <= 4;
  }

  return normalized.split(/[,/|+]/).includes(weekday);
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime12(start)} – ${formatTime12(end)}`;
}
