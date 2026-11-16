"use client";

import { useState } from "react";
import type { StudyLog } from "@/lib/types";
import ChartCard from "@/components/manage/analytics/ChartCard";
import { localDateKey } from "@/components/manage/analytics/chart-utils";

type Period = "7d" | "30d" | "1y" | "all" | "custom";
type Granularity = "day" | "week" | "month";
type StudyPoint = {
  key: string;
  label: string;
  minutes: number;
};

const dayInMilliseconds = 24 * 60 * 60 * 1000;

function parseDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDateRange(logs: StudyLog[], period: Period, customStart: string, customEnd: string) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const end = period === "custom" ? parseDateKey(customEnd) : today;

  if (!end) return null;

  if (period === "custom") {
    const start = parseDateKey(customStart);
    if (!start || localDateKey(start) > localDateKey(end)) return null;
    return { start, end };
  }

  if (period === "all") {
    const oldestLog = logs
      .map((log) => parseDateKey(log.study_date))
      .filter((date): date is Date => date !== null)
      .sort((first, second) => first.getTime() - second.getTime())[0];
    return { start: oldestLog || addDays(end, -6), end };
  }

  const daysToShow = period === "7d" ? 7 : period === "30d" ? 30 : 365;
  return { start: addDays(end, -(daysToShow - 1)), end };
}

function getGranularity(dayCount: number): Granularity {
  if (dayCount <= 14) return "day";
  if (dayCount <= 90) return "week";
  return "month";
}

function getSeries(logs: StudyLog[], range: { start: Date; end: Date }, granularity: Granularity): StudyPoint[] {
  const startKey = localDateKey(range.start);
  const endKey = localDateKey(range.end);
  const dayCount = Math.max(1, Math.floor((Date.UTC(range.end.getFullYear(), range.end.getMonth(), range.end.getDate()) - Date.UTC(range.start.getFullYear(), range.start.getMonth(), range.start.getDate())) / dayInMilliseconds) + 1);
  const buckets: { key: string; label: string; startDate: Date; endDate: Date }[] = [];

  if (granularity === "month") {
    const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1, 12);
    while (cursor <= range.end) {
      const monthStart = new Date(cursor);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 12);
      buckets.push({
        key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
        label: cursor.toLocaleDateString("bn-BD", { month: "short", year: "2-digit" }),
        startDate: monthStart < range.start ? range.start : monthStart,
        endDate: monthEnd > range.end ? range.end : monthEnd,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const bucketSize = granularity === "day" ? 1 : 7;
    const bucketCount = Math.ceil(dayCount / bucketSize);
    for (let index = 0; index < bucketCount; index += 1) {
      const bucketStart = addDays(range.start, index * bucketSize);
      const bucketEnd = addDays(bucketStart, bucketSize - 1) > range.end ? range.end : addDays(bucketStart, bucketSize - 1);
      const key = granularity === "day" ? localDateKey(bucketStart) : `week-${localDateKey(bucketStart)}`;
      const label = granularity === "day"
        ? bucketStart.toLocaleDateString("bn-BD", { day: "numeric", month: "short" })
        : bucketStart.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
      buckets.push({ key, label, startDate: bucketStart, endDate: bucketEnd });
    }
  }

  const totals = new Map<string, number>();
  for (const log of logs) {
    if (log.study_date < startKey || log.study_date > endKey) continue;
    const logDate = parseDateKey(log.study_date);
    if (!logDate) continue;

    let bucketKey: string;
    if (granularity === "month") {
      bucketKey = log.study_date.slice(0, 7);
    } else if (granularity === "day") {
      bucketKey = log.study_date;
    } else {
      const offset = Math.floor((Date.UTC(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()) - Date.UTC(range.start.getFullYear(), range.start.getMonth(), range.start.getDate())) / dayInMilliseconds);
      bucketKey = `week-${localDateKey(addDays(range.start, Math.floor(offset / 7) * 7))}`;
    }

    totals.set(bucketKey, (totals.get(bucketKey) || 0) + (Number(log.actual_minutes) || 0));
  }

  return buckets.map(({ key, label }) => ({ key, label, minutes: totals.get(key) || 0 }));
}

export default function DailyStudyChart({ logs }: { logs: StudyLog[] }) {
  const today = new Date();
  const initialEnd = localDateKey(today);
  const initialStart = localDateKey(addDays(today, -6));
  const [period, setPeriod] = useState<Period>("7d");
  const [customStart, setCustomStart] = useState(initialStart);
  const [customEnd, setCustomEnd] = useState(initialEnd);
  const range = getDateRange(logs, period, customStart, customEnd);
  const dayCount = range
    ? Math.floor((Date.UTC(range.end.getFullYear(), range.end.getMonth(), range.end.getDate()) - Date.UTC(range.start.getFullYear(), range.start.getMonth(), range.start.getDate())) / dayInMilliseconds) + 1
    : 0;
  const granularity = getGranularity(dayCount);
  const points = range ? getSeries(logs, range, granularity) : [];
  const maxMinutes = Math.max(...points.map((point) => point.minutes), 60);
  const chartWidth = Math.max(420, points.length * 48 + 20);
  const plotTop = 24;
  const baseline = 160;
  const plotHeight = baseline - plotTop;
  const step = points.length > 0 ? (chartWidth - 20) / points.length : chartWidth - 20;
  const barWidth = Math.min(28, step * 0.58);

  function handlePeriodChange(value: string) {
    setPeriod(value as Period);
  }

  return (
    <ChartCard title="পড়ার সময়ের গ্রাফ" description="সময়কাল বদলে আজকের তথ্য পরে আবার খুঁজে দেখো।">
      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(150px,.7fr)_minmax(0,1.3fr)] sm:items-end">
        <label>
          <span className="label">সময়কাল</span>
          <select className="field" value={period} onChange={(event) => handlePeriodChange(event.target.value)}>
            <option value="7d">গত ৭ দিন</option>
            <option value="30d">গত ৩০ দিন</option>
            <option value="1y">গত ১ বছর</option>
            <option value="all">পুরো history</option>
            <option value="custom">নিজে তারিখ বেছে নাও</option>
          </select>
        </label>
        {period === "custom" && (
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <label>
              <span className="label">শুরুর তারিখ</span>
              <input type="date" className="field min-w-0" value={customStart} max={customEnd} onChange={(event) => setCustomStart(event.target.value)} />
            </label>
            <label>
              <span className="label">শেষ তারিখ</span>
              <input type="date" className="field min-w-0" value={customEnd} min={customStart} max={initialEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </label>
          </div>
        )}
      </div>

      {range ? (
        <>
          <p className="mb-2 text-[11px] text-slate-500">
            {granularity === "day" ? "দিনভিত্তিক" : granularity === "week" ? "সপ্তাহভিত্তিক" : "মাসভিত্তিক"} · {points.length}টি সময়ের ভাগ
          </p>
          <div className="overflow-x-auto rounded-xl bg-green-50/60 px-2 pt-2">
            <svg
              width={chartWidth}
              height="210"
              viewBox={`0 0 ${chartWidth} 210`}
              role="img"
              aria-label="নির্বাচিত সময়কালের পড়ার সময়ের বার চার্ট"
              className="block max-w-none"
            >
              <line x1="10" y1="78" x2={chartWidth - 10} y2="78" stroke="#254333" strokeDasharray="4 5" />
              <line x1="10" y1="119" x2={chartWidth - 10} y2="119" stroke="#254333" strokeDasharray="4 5" />
              <line x1="10" y1={baseline} x2={chartWidth - 10} y2={baseline} stroke="#375642" />
              {points.map((point, index) => {
                const x = 10 + index * step + (step - barWidth) / 2;
                const barHeight = point.minutes > 0 ? Math.max((point.minutes / maxMinutes) * plotHeight, 3) : 2;
                const y = baseline - barHeight;

                return (
                  <g key={point.key}>
                    <title>{`${point.label}: ${point.minutes} মিনিট`}</title>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="7"
                      fill={point.minutes > 0 ? "#22c55e" : "#254331"}
                    />
                    <text x={x + barWidth / 2} y={Math.max(y - 7, 15)} textAnchor="middle" fill="#c4f0cc" fontSize="10" fontWeight="700">
                      {point.minutes}
                    </text>
                    <text x={x + barWidth / 2} y="184" textAnchor="middle" fill="#91aa98" fontSize="10">
                      {point.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            পুরোনো দিনের নির্দিষ্ট graph দেখতে “নিজে তারিখ বেছে নাও” থেকে তারিখ নির্বাচন করো।
          </p>
          {logs.length === 0 && <p className="mt-2 text-center text-xs text-slate-400">পড়ার লগ যোগ করলে এখানে চার্ট দেখা যাবে।</p>}
        </>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-4 text-sm text-amber-800">
          শুরুর তারিখ শেষ তারিখের আগে নির্বাচন করো।
        </p>
      )}
    </ChartCard>
  );
}
