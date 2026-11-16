"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { getDhakaRoutineClock } from "@/lib/routine-time";

export default function LiveClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const intervalId = window.setInterval(update, 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const clock = now ? getDhakaRoutineClock(now) : null;
  const digitalTime = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now)
    : "--:--:-- --";

  const dhakaTime = now
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(now)
    : [];
  const hour = Number(dhakaTime.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(dhakaTime.find((part) => part.type === "minute")?.value || 0);
  const second = Number(dhakaTime.find((part) => part.type === "second")?.value || 0);
  const minuteAngle = (minute + second / 60) * 6;
  const hourAngle = ((hour % 12) + minute / 60 + second / 3_600) * 30;
  const secondAngle = second * 6;

  return (
    <section aria-label="ঢাকার বর্তমান সময়" className="card inline-flex max-w-full items-center gap-4 overflow-hidden p-3.5 sm:gap-6 sm:p-4">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-green-500">
          <Clock3 size={13} /> Live · Dhaka
        </p>
        <time dateTime={now?.toISOString()} className="mt-1.5 block whitespace-nowrap font-mono text-xl font-black tabular-nums tracking-tight text-green-950 sm:text-2xl">
          {digitalTime}
        </time>
        <p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-slate-500 sm:text-xs">
          {clock ? `${clock.day} · ${clock.dateLabel}` : "বাংলাদেশ সময়"}
        </p>
      </div>

      <div className="shrink-0 rounded-full bg-green-500/10 p-1.5 sm:p-2">
        <svg viewBox="0 0 120 120" className="h-[86px] w-[86px] sm:h-[104px] sm:w-[104px]" role="img" aria-label={`Analog clock ${digitalTime}`}>
          <circle cx="60" cy="60" r="56" fill="#09140d" stroke="#2c7142" strokeWidth="2" />
          <circle cx="60" cy="60" r="49" fill="none" stroke="#193b25" strokeWidth="1" />
          {Array.from({ length: 60 }, (_, index) => {
            const major = index % 5 === 0;
            return (
              <line
                key={index}
                x1="60"
                y1={major ? "8" : "10"}
                x2="60"
                y2={major ? "17" : "14"}
                transform={`rotate(${index * 6} 60 60)`}
                stroke={major ? "#86efac" : "#376348"}
                strokeWidth={major ? "2" : "1"}
                strokeLinecap="round"
              />
            );
          })}
          {Array.from({ length: 12 }, (_, index) => {
            const number = index === 0 ? 12 : index;
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const x = 60 + Math.cos(angle) * 37;
            const y = 60 + Math.sin(angle) * 37;
            return (
              <text key={number} x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#d9fbe2" fontSize="7" fontWeight="700">
                {number}
              </text>
            );
          })}
          <line x1="60" y1="60" x2="60" y2="34" transform={`rotate(${hourAngle} 60 60)`} stroke="#e8fff0" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="60" x2="60" y2="22" transform={`rotate(${minuteAngle} 60 60)`} stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="60" y1="68" x2="60" y2="15" transform={`rotate(${secondAngle} 60 60)`} stroke="#bef264" strokeWidth="1" strokeLinecap="round" />
          <circle cx="60" cy="60" r="3.5" fill="#bef264" stroke="#07100a" strokeWidth="1.5" />
        </svg>
      </div>
    </section>
  );
}
