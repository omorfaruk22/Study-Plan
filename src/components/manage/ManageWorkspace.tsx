"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import DeleteConfirmDialog from "@/components/manage/DeleteConfirmDialog";
import RoutineManager from "@/components/manage/RoutineManager";
import StudyLogsManager from "@/components/manage/StudyLogsManager";
import SubjectsManager from "@/components/manage/SubjectsManager";
import TasksManager from "@/components/manage/TasksManager";
import WorkspaceHeader from "@/components/manage/WorkspaceHeader";
import WorkspaceStats from "@/components/manage/WorkspaceStats";
import WorkspaceTabs, { type WorkspaceTab } from "@/components/manage/WorkspaceTabs";
import { MongoConnectionError, SuccessToast, WorkspaceFeedback } from "@/components/manage/WorkspaceFeedback";
import { requestApi } from "@/lib/owner-api";
import type {
  OwnerCollection,
  OwnerWorkspaceData,
  RoutineInput,
  StudyLogInput,
  StudyTaskInput,
  SubjectInput,
} from "@/lib/types";

const emptyWorkspace: OwnerWorkspaceData = {
  routine: [],
  logs: [],
  tasks: [],
  subjects: [],
};

export default function ManageWorkspace() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<OwnerWorkspaceData>(emptyWorkspace);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("routine");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    collection: OwnerCollection;
    id: string;
    itemName: string;
  } | null>(null);

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
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
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
    return runAction(
      async () => {
        await requestApi(url, id ? "PATCH" : "POST", item);
      },
      successMessage,
    );
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
    await runAction(
      async () => {
        await requestApi(`/api/owner/${collection}/${id}`, "DELETE");
      },
      `“${itemName}” মুছে ফেলা হয়েছে।`,
    );
    setPendingDelete(null);
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

  function selectTab(tab: WorkspaceTab) {
    setActiveTab(tab);
    setMessage("");
    setError("");
  }

  if (!ready) {
    return (
      <>
        <Header />
        <main className="container py-20 text-center text-slate-500">Owner access যাচাই করা হচ্ছে...</main>
      </>
    );
  }

  if (error && workspace.routine.length === 0 && workspace.subjects.length === 0) {
    return (
      <>
        <Header />
        <MongoConnectionError message={error} />
      </>
    );
  }

  return (
    <>
      <Header owner />
      <SuccessToast message={message} onClose={closeSuccessToast} />
      {pendingDelete && (
        <DeleteConfirmDialog
          itemName={pendingDelete.itemName}
          busy={busy}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
      <main className="container pb-16 pt-8">
        <WorkspaceHeader />
        <WorkspaceStats routine={workspace.routine} logs={workspace.logs} tasks={workspace.tasks} />
        <WorkspaceTabs activeTab={activeTab} onChange={selectTab} onRefresh={() => void refresh()} />
        <WorkspaceFeedback error={error} />

        {activeTab === "routine" && (
          <RoutineManager
            routine={workspace.routine}
            subjects={workspace.subjects}
            busy={busy}
            onSave={(item: RoutineInput, id?: string) => saveRecord("weekly_routine", item, id, id ? "রুটিন আপডেট হয়েছে।" : "নতুন রুটিন যোগ হয়েছে।")}
            onDelete={(id) => requestDelete("weekly_routine", id)}
          />
        )}
        {activeTab === "logs" && (
          <StudyLogsManager
            logs={workspace.logs}
            subjects={workspace.subjects}
            busy={busy}
            onSave={(item: StudyLogInput, id?: string) => saveRecord("study_logs", item, id, id ? "পড়ার লগ আপডেট হয়েছে।" : "আজকের পড়ার হিসাব সংরক্ষণ হয়েছে।")}
            onDelete={(id) => requestDelete("study_logs", id)}
          />
        )}
        {activeTab === "tasks" && (
          <TasksManager
            tasks={workspace.tasks}
            subjects={workspace.subjects}
            busy={busy}
            onSave={(item: StudyTaskInput, id?: string) => saveRecord("study_tasks", item, id, id ? "কাজ আপডেট হয়েছে।" : "নতুন কাজ যোগ হয়েছে।")}
            onDelete={(id) => requestDelete("study_tasks", id)}
          />
        )}
        {activeTab === "subjects" && (
          <SubjectsManager
            subjects={workspace.subjects}
            busy={busy}
            onSave={(item: SubjectInput, id?: string) => saveRecord("subjects", item, id, id ? "বিষয় আপডেট হয়েছে।" : "নতুন বিষয় যোগ হয়েছে।")}
            onDelete={(id) => requestDelete("subjects", id)}
          />
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          <ShieldCheck size={14} className="mr-1 inline" /> Owner-only workspace · Protected by server-side authorization
        </p>
      </main>
    </>
  );
}
