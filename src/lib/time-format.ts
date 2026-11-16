export function formatTime12(value: string) {
  const time24 = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (time24) {
    const hour = Number(time24[1]);
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${time24[2]} ${hour < 12 ? "AM" : "PM"}`;
  }

  const time12 = value.trim().match(/^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$/i);
  if (time12) {
    const displayHour = Number(time12[1]);
    return `${displayHour}:${time12[2]} ${time12[3].toUpperCase()}`;
  }

  return value;
}

export function parseTimeInput(value: string) {
  const raw = value.trim();
  const time24 = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (time24) return `${String(Number(time24[1])).padStart(2, "0")}:${time24[2]}`;

  const time12 = raw.match(/^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$/i);
  if (!time12) return value;

  let hour = Number(time12[1]) % 12;
  if (time12[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${time12[2]}`;
}
