"use client";

import DataBackupTools from "@/components/manage/DataBackupTools";
import DailyGoalsPanel from "@/components/manage/DailyGoalsPanel";
import ReviewReminderPanel from "@/components/manage/ReviewReminderPanel";
import { Moon, Sun, Trophy } from "lucide-react";
import type { StudyLog } from "@/lib/types";

type PlannerSettingsPanelProps = {
  logs: StudyLog[];
  busy: boolean;
  onRestored: () => Promise<void>;
  onReviewed: (log: StudyLog, today: string, nextReview: string) => Promise<boolean>;
  id?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
};

export default function PlannerSettingsPanel({ logs, busy, onRestored, onReviewed, id, darkMode, onToggleDarkMode }: PlannerSettingsPanelProps) {
  const canChangeAppearance = typeof darkMode === "boolean" && Boolean(onToggleDarkMode);
  return (
    <section id={id} className="planner-dashboard-settings">
      <div className="planner-settings-title">
        <span><Trophy size={19} /></span>
        <div><p>Planner controls</p><h2>Goals, review, and your data</h2></div>
      </div>
      {canChangeAppearance && (
        <section className="planner-appearance-panel" aria-label="Appearance settings">
          <span className="planner-appearance-icon">{darkMode ? <Moon size={19} /> : <Sun size={19} />}</span>
          <div>
            <p>Appearance</p>
            <h3>{darkMode ? "Dark mode চালু আছে" : "Light mode চালু আছে"}</h3>
            <span>{darkMode ? "আরামদায়ক গাঢ় রঙে planner দেখা যাচ্ছে।" : "হালকা রঙে planner দেখা যাচ্ছে।"}</span>
          </div>
          <button type="button" className="btn btn-plain planner-appearance-toggle" aria-pressed={darkMode} onClick={onToggleDarkMode}>
            {darkMode ? <Sun size={15} /> : <Moon size={15} />} {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </section>
      )}
      <div className="planner-settings-grid">
        <DailyGoalsPanel logs={logs} />
        <ReviewReminderPanel logs={logs} busy={busy} onReviewed={onReviewed} />
      </div>
      <DataBackupTools onRestored={onRestored} />
    </section>
  );
}
