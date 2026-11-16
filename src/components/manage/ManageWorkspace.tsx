"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import AcademicManager from "@/components/manage/AcademicManager";
import AnalyticsDashboard from "@/components/manage/analytics/AnalyticsDashboard";
import DeleteConfirmDialog from "@/components/manage/DeleteConfirmDialog";
import DailyGoalsPanel from "@/components/manage/DailyGoalsPanel";
import DataBackupTools from "@/components/manage/DataBackupTools";
import ReviewReminderPanel from "@/components/manage/ReviewReminderPanel";
import DuetManager from "@/components/manage/DuetManager";
import RoutineManager from "@/components/manage/RoutineManager";
import TasksManager from "@/components/manage/TasksManager";
import WorkspaceHeader from "@/components/manage/WorkspaceHeader";
import WorkspaceStats from "@/components/manage/WorkspaceStats";
import WorkspaceTabs, { type WorkspaceTab } from "@/components/manage/WorkspaceTabs";
import { MongoConnectionError, SuccessToast, WorkspaceFeedback } from "@/components/manage/WorkspaceFeedback";
import { requestApi } from "@/lib/owner-api";
import type { OwnerCollection, OwnerWorkspaceData, RoutineInput, StudyLogInput, StudyTaskInput, SubjectInput } from "@/lib/types";

type ManageWorkspaceProps = { activeTab: WorkspaceTab };

const emptyWorkspace: OwnerWorkspaceData = { routine: [], logs: [], tasks: [], subjects: [] };

function withoutDeletedItem(workspace: OwnerWorkspaceData, collection: OwnerCollection, id: string): OwnerWorkspaceData {
  switch (collection) {
    case "weekly_routine": return { ...workspace, routine: workspace.routine.filter((item) => item.id !== id) };
    case "study_logs": return { ...workspace, logs: workspace.logs.filter((item) => item.id !== id) };
    case "study_tasks": return { ...workspace, tasks: workspace.tasks.filter((item) => item.id !== id) };
    case "subjects": return { ...workspace, subjects: workspace.subjects.filter((item) => item.id !== id) };
  }
}

export default function ManageWorkspace({ activeTab }: ManageWorkspaceProps) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<OwnerWorkspaceData>(emptyWorkspace);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ collection: OwnerCollection; id: string; itemName: string } | null>(null);

  const load = useCallback(async () => {
    const data = await requestApi<OwnerWorkspaceData>("/api/owner");
    setWorkspace(data);
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .catch((loadError: unknown) => {
        if (!active) return;
        const errorMessage = loadError instanceof Error ? loadError.message : "সমস্যা হয়েছে।";
        if (errorMessage === "অনুমতি নেই।") {
          router.replace("/login");
          return;
        }
        setError(errorMessage);
      })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [load, router]);

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await load();
      setMessage(successMessage);
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "সমস্যা হয়েছে।");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function saveRecord(collection: OwnerCollection, item: unknown, id: string | undefined, successMessage: string) {
    const url = id ? `/api/owner/${collection}/${id}` : `/api/owner/${collection}`;
    return runAction(async () => { await requestApi(url, id ? "PATCH" : "POST", item); }, successMessage);
  }

  function requestDelete(collection: OwnerCollection, id: string) {
    const itemName = {
      weekly_routine: workspace.routine.find((item) => item.id === id)?.title,
      study_logs: workspace.logs.find((item) => item.id === id)?.topic,
      study_tasks: workspace.tasks.find((item) => item.id === id)?.title,
      subjects: workspace.subjects.find((item) => item.id === id)?.name,
    }[collection] || "নির্বাচিত তথ্য";
    setPendingDelete({ collection, id, itemName });
  }

  async function confirmDelete() {
    if (!pendingDelete || busy) return;
    const { collection, id, itemName } = pendingDelete;
    const previousWorkspace = workspace;
    setWorkspace((current) => withoutDeletedItem(current, collection, id));
    setPendingDelete(null);
    setMessage("");
    setError("");
    setBusy(true);
    try {
      await requestApi(`/api/owner/${collection}/${id}`, "DELETE");
      setMessage(`“${itemName}” মুছে ফেলা হয়েছে।`);
    } catch (deleteError) {
      setWorkspace(previousWorkspace);
      setError(deleteError instanceof Error ? deleteError.message : "তথ্যটি মুছে ফেলা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  const closeSuccessToast = useCallback(() => setMessage(""), []);

  async function refresh() {
    setError("");
    setMessage("");
    try {
      await load();
      setMessage("তথ্য আপডেট হয়েছে।");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "সমস্যা হয়েছে।");
    }
  }

  if (!ready) {
    return <><Header /><main className="container py-20 text-center text-slate-500">Owner access যাচাই করা হচ্ছে...</main></>;
  }

  if (error && workspace.routine.length === 0 && workspace.subjects.length === 0) {
    return <><Header /><MongoConnectionError message={error} /></>;
  }

  return (
    <>
      <Header owner />
      <SuccessToast message={message} onClose={closeSuccessToast} />
      {pendingDelete && <DeleteConfirmDialog itemName={pendingDelete.itemName} busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={() => void confirmDelete()} />}
      <main className="container pb-12 pt-6 sm:pb-16 sm:pt-8">
        <WorkspaceHeader />
        <DataBackupTools onRestored={load} />
        <WorkspaceStats routine={workspace.routine} logs={workspace.logs} tasks={workspace.tasks} />
        <DailyGoalsPanel logs={workspace.logs} />
        <ReviewReminderPanel
          logs={workspace.logs}
          busy={busy}
          onReviewed={(log, today, nextReview) => {
            const { id, ...data } = log;
            return saveRecord("study_logs", { ...data, last_reviewed_date: today, review_due_date: nextReview }, id, "আবার পড়ার হিসাব হয়েছে; ৩ দিন পরে আবার মনে করাবো।");
          }}
        />
        <WorkspaceTabs activeTab={activeTab} onRefresh={() => void refresh()} />
        <WorkspaceFeedback error={error} />

<div key={activeTab} className="manage-section-enter">
        {activeTab === "routine" && <RoutineManager
          routine={workspace.routine}
          subjects={workspace.subjects}
          busy={busy}
          onSave={(item: RoutineInput, id?: string) => saveRecord("weekly_routine", item, id, id ? "রুটিন আপডেট হয়েছে।" : "নতুন রুটিন যোগ হয়েছে।")}
          onDelete={(id) => requestDelete("weekly_routine", id)}
        />}
        {activeTab === "academic" && <AcademicManager
          logs={workspace.logs}
          subjects={workspace.subjects}
          busy={busy}
          onSave={(item: StudyLogInput, id?: string) => saveRecord("study_logs", item, id, id ? "পড়ার হিসাব আপডেট হয়েছে।" : item.study_track === "academic" ? "একাডেমিক পড়ার হিসাব সংরক্ষণ হয়েছে।" : item.study_track === "duet_department" ? "DUET Department পড়ার হিসাব সংরক্ষণ হয়েছে।" : "DUET Non-Department পড়ার হিসাব সংরক্ষণ হয়েছে।")}
          onSaveSubject={(item: SubjectInput, id?: string) => saveRecord("subjects", item, id, id ? "বিষয় আপডেট হয়েছে।" : "একাডেমিক বিষয় যোগ হয়েছে।")}
          onDeleteLog={(id) => requestDelete("study_logs", id)}
          onDeleteSubject={(id) => requestDelete("subjects", id)}
        />}
        {activeTab === "duet" && <DuetManager
          logs={workspace.logs}
          subjects={workspace.subjects}
          busy={busy}
          onSave={(item: StudyLogInput, id?: string) => saveRecord("study_logs", item, id, id ? "পড়ার হিসাব আপডেট হয়েছে।" : item.study_track === "academic" ? "একাডেমিক পড়ার হিসাব সংরক্ষণ হয়েছে।" : item.study_track === "duet_department" ? "DUET Department পড়ার হিসাব সংরক্ষণ হয়েছে।" : "DUET Non-Department পড়ার হিসাব সংরক্ষণ হয়েছে।")}
          onSaveSubject={(item: SubjectInput, id?: string) => saveRecord("subjects", item, id, id ? "বিষয় আপডেট হয়েছে।" : "DUET বিষয় যোগ হয়েছে।")}
          onDeleteLog={(id) => requestDelete("study_logs", id)}
          onDeleteSubject={(id) => requestDelete("subjects", id)}
        />}
        {activeTab === "tasks" && <TasksManager
          tasks={workspace.tasks}
          subjects={workspace.subjects}
          busy={busy}
          onSave={(item: StudyTaskInput, id?: string) => saveRecord("study_tasks", item, id, id ? "কাজ আপডেট হয়েছে।" : "নতুন কাজ যোগ হয়েছে।")}
          onDelete={(id) => requestDelete("study_tasks", id)}
        />}
        {activeTab === "analytics" && <AnalyticsDashboard logs={workspace.logs} tasks={workspace.tasks} subjects={workspace.subjects} />}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          <ShieldCheck size={14} className="mr-1 inline" /> Owner-only workspace · Protected by server-side authorization
        </p>
      </main>
    </>
  );
}
