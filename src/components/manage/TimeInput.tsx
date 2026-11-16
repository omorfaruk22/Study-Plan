"use client";

import { parseTimeInput, formatTime12 } from "@/lib/time-format";

type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export default function TimeInput({ value, onChange, required = true }: TimeInputProps) {
  return (
    <input
      required={required}
      className="field"
      value={formatTime12(value)}
      onChange={(event) => onChange(parseTimeInput(event.target.value))}
      placeholder="যেমন: 7:00 PM বা মাগরিব"
      autoComplete="off"
    />
  );
}
