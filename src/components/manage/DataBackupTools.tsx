"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ArchiveRestore, ChevronDown, Download, ShieldAlert, Upload } from "lucide-react";
import { requestApi } from "@/lib/owner-api";
import useResponsiveDisclosure from "@/components/manage/useResponsiveDisclosure";

type BackupFile = {
  format: string;
  version: number;
  exportedAt?: string;
  weekly_routine: unknown[];
  study_logs: unknown[];
  study_tasks: unknown[];
  subjects: unknown[];
  goals: Record<string, number>;
};

type DataBackupToolsProps = { onRestored: () => Promise<void> };

function dateSuffix() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function DataBackupTools({ onRestored }: DataBackupToolsProps) {
  const [open, setOpen] = useResponsiveDisclosure();
  const fileInput = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<{ file: string; data: BackupFile } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function exportBackup() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const backup = await requestApi<BackupFile>("/api/owner/backup");
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `study-manager-backup-${dateSuffix()}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setMessage("Backup ফাইল ডাউনলোড হয়েছে। নিরাপদ জায়গায় রেখে দাও।");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Backup তৈরি করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  async function exportStudyLogsCsv() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const backup = await requestApi<BackupFile>("/api/owner/backup");
      const headers = ["তারিখ", "বিভাগ", "বিষয়", "টপিক", "বাস্তব মিনিট", "অবস্থা", "নোট", "পরের review"];
      const rows = backup.study_logs.map((value) => {
        const log = value as Record<string, unknown>;
        const track = log.study_track === "academic" ? "Academic"
          : log.study_track === "duet_department" ? "DUET Department"
            : log.study_track === "duet_non_department" ? "DUET Non-Department" : "";
        return [log.study_date, track, log.subject_name || log.subject_id, log.topic, log.actual_minutes, log.status, log.notes, log.review_due_date];
      });
      const escape = (value: unknown) => {
        let text = String(value ?? "");
        if (/^[=+@-]/.test(text.trimStart())) text = "'" + text;
        return '"' + text.replaceAll('"', '""') + '"';
      };
      const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "study-logs-" + dateSuffix() + ".csv";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setMessage("Study log-এর CSV ফাইল ডাউনলোড হয়েছে; Excel-এ খোলা যাবে।");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "CSV তৈরি করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  async function selectBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    try {
      const parsed = JSON.parse(await file.text()) as BackupFile;
      if (parsed.format !== "faruk-study-manager-backup" || parsed.version !== 1) throw new Error("এই backup format সমর্থিত নয়।");
      setCandidate({ file: file.name, data: parsed });
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Backup ফাইলটি পড়া যায়নি।");
    }
  }

  async function restoreBackup() {
    if (!candidate || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await requestApi("/api/owner/backup", "POST", { backup: candidate.data });
      await onRestored();
      window.dispatchEvent(new Event("faruk-study-manager:refresh-goals"));
      setCandidate(null);
      setMessage("Backup-এর তথ্য merge করে restore হয়েছে।");
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Restore সম্পন্ন হয়নি।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="mobile-disclosure mt-3 rounded-2xl border border-green-900 bg-[#0c1710] p-3.5 text-green-50 sm:mt-4 sm:px-4">
      <summary className="sm:hidden">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-400/10 text-green-300"><ArchiveRestore size={18} /></span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold">Data backup</span>
            <span className="block text-[10px] text-green-100/65">JSON · CSV · Restore</span>
          </span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-green-300" />
      </summary>
      <div className="mobile-disclosure-content mobile-disclosure-flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-400/10 text-green-300"><ArchiveRestore size={18} /></span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold">Data backup</p>
          <p className="text-[11px] leading-4 text-green-100/65">পুরো data JSON-এ backup, পড়ার হিসাব Excel-compatible CSV-তে export, অথবা merge restore</p>
        </div>
      </div>
      <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:justify-end">
        <button type="button" aria-label="JSON backup download" title="JSON Backup" disabled={busy} onClick={() => void exportBackup()} className="btn btn-compact btn-primary">
          <Download size={13} /> <span className="sm:hidden">JSON</span><span className="hidden sm:inline">JSON Backup</span>
        </button>
        <button type="button" aria-label="CSV study log download" title="CSV Log" disabled={busy} onClick={() => void exportStudyLogsCsv()} className="btn btn-compact btn-plain">
          <Download size={13} /> <span className="sm:hidden">CSV</span><span className="hidden sm:inline">CSV Log</span>
        </button>
        <button type="button" aria-label="Restore from backup" title="Restore" disabled={busy} onClick={() => fileInput.current?.click()} className="btn btn-compact btn-plain">
          <Upload size={13} /> Restore
        </button>
      </div>
      <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void selectBackup(event)} />
      {message && <p role="status" className="w-full text-xs font-semibold text-green-300">{message}</p>}
      {error && <p role="alert" className="w-full text-xs font-semibold text-red-300">{error}</p>}

      {candidate && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-green-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setCandidate(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="backup-restore-title" className="w-full max-w-md overflow-hidden rounded-[26px] border border-green-100 bg-white text-slate-800 shadow-2xl animate-rise">
            <div className="h-2 bg-gradient-to-r from-green-800 via-emerald-500 to-lime-300" />
            <div className="p-5 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><ShieldAlert size={23} /></span>
              <h2 id="backup-restore-title" className="mt-3 text-xl font-black text-green-950">Backup restore করব?</h2>
              <p className="mt-1 break-all text-xs font-semibold text-slate-500">{candidate.file}</p>
              <p className="mt-4 text-sm leading-6 text-slate-600">একই ID-র record backup দিয়ে update হবে; backup-এ না থাকা বর্তমান record মুছবে না। Restore করার আগে চাইলে বর্তমান data-র backup নামিয়ে রাখো।</p>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" disabled={busy} onClick={() => setCandidate(null)} className="btn btn-plain w-full sm:w-auto">বাতিল</button>
                <button type="button" disabled={busy} onClick={() => void restoreBackup()} className="btn btn-primary w-full sm:w-auto">
                  <ArchiveRestore size={15} /> {busy ? "Restore হচ্ছে…" : "Merge করে restore"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      </div>
    </details>
  );
}
