"use client";

import { useEffect, useState } from "react";
import { Clock3, MapPin } from "lucide-react";

type LiveClocksProps = {
  compact?: boolean;
};

const dhakaTimeZone = "Asia/Dhaka";

export default function LiveClocks({ compact = false }: LiveClocksProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const intervalId = window.setInterval(update, 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const digitalTime = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: dhakaTimeZone,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now)
    : "--:--:-- --";
  const dateLabel = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: dhakaTimeZone,
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(now)
    : "Loading date";

  return (
    <section aria-label="বাংলাদেশের বর্তমান সময়" className={compact ? "public-live-clock is-compact" : "public-live-clock"}>
      <span className="public-live-clock-icon" aria-hidden="true"><Clock3 size={16} /></span>
      <div className="public-live-clock-copy">
        <p><MapPin size={11} /> Bangladesh</p>
        <time dateTime={now?.toISOString()}>{digitalTime}</time>
        {!compact && <small>{dateLabel}</small>}
      </div>
      {compact && <small>{dateLabel}</small>}
    </section>
  );
}
