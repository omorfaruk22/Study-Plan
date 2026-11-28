"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AcademicManager from "@/components/manage/AcademicManager";
import AnalyticsDashboard from "@/components/manage/analytics/AnalyticsDashboard";
import DeleteConfirmDialog from "@/components/manage/DeleteConfirmDialog";
import DuetManager from "@/components/manage/DuetManager";
import OwnerDashboard from "@/components/manage/OwnerDashboard";
import RoutineManager from "@/components/manage/RoutineManager";
import TasksManager from "@/components/manage/TasksManager";
import WorkspaceHeader from "@/components/manage/WorkspaceHeader";
import WorkspaceTabs, { type WorkspaceTab } from "@/components/manage/WorkspaceTabs";
import { MongoConnectionError, SuccessToast, WorkspaceFeedback } from "@/components/manage/WorkspaceFeedback";
import { requestApi } from "@/lib/owner-api";
import type { OwnerCollection, OwnerWorkspaceData, RoutineInput, StudyLogInput, StudyTaskInput, SubjectInput } from "@/lib/types";

type ManageWorkspaceProps = { activeTab: WorkspaceTab };

const emptyWorkspace: OwnerWorkspaceData = { routine: [], logs: [], tasks: [], subjects: [] };

const sectionMeta: Record<Exclude<WorkspaceTab, "dashboard">, { eyebrow: string; title: string; description: string }> = {
  routine: {
    eyebrow: "Weekly planning",
    title: "রুটিন ও ক্লাস সাজাও",
    description: "সময়, দিন ও বিষয় এক জায়গায় গুছিয়ে রাখো।",
  },
  academic: {
    eyebrow: "Academic study",
    title: "একাডেমিক পড়া",
    description: "বিষয় যোগ করো, focus session রাখো এবং অগ্রগতি ট্র্যাক করো।",
  },
  duet: {
    eyebrow: "DUET preparation",
    title: "DUET প্রস্তুতি",
    description: "Department ও Non-Department পড়ার হিসাব আলাদা করে রাখো।",
  },
  tasks: {
    eyebrow: "Assignments & exams",
    title: "কাজ ও ডেডলাইন",
    description: "যা জরুরি, তা চোখের সামনে রাখো।",
  },
  analytics: {
    eyebrow: "Study insights",
    title: "অগ্রগতির চিত্র",
    description: "সময়, ধারাবাহিকতা ও কাজের অবস্থা বুঝে পরের পদক্ষেপ নাও।",
  },
};

function withoutDeletedItem(workspace: OwnerWorkspaceData, collection: OwnerCollection, id: string): OwnerWorkspaceData {
  switch (collection) {
    case "weekly_routine": return { ...workspace, routine: workspace.routine.filter((item) => item.id !== id) };
    case "study_logs": return { ...workspace, logs: workspace.logs.filter((item) => item.id !== id) };
    case "study_tasks": return { ...workspace, tasks: workspace.tasks.filter((item) => item.id !== id) };
    case "subjects": {
      const removedSubject = workspace.subjects.find((item) => item.id === id);
      const preservedName = removedSubject?.name?.trim() || null;
      return {
        ...workspace,
        subjects: workspace.subjects.filter((item) => item.id !== id),
        routine: workspace.routine.map((item) => item.subject_id === id ? { ...item, subject_id: null, subject_name: preservedName || item.subject_name || null } : item),
        logs: workspace.logs.map((item) => item.subject_id === id ? { ...item, subject_id: null, subject_name: preservedName || item.subject_name || null } : item),
        tasks: workspace.tasks.map((item) => item.subject_id === id ? { ...item, subject_id: null, subject_name: preservedName || item.subject_name || null } : item),
      };
    }
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

  async function runAction(action: () => Promise<void>, successMessage: string, refreshWorkspace = true) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      if (refreshWorkspace) await load();
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
    const url = id ? "/api/owner/" + collection + "/" + id : "/api/owner/" + collection;
    if (collection === "subjects") {
      const subjectData = item as SubjectInput;
      const subjectId = id || "pending-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      const previousSubjects = workspace.subjects;
      const optimisticSubject = { ...subjectData, id: subjectId };
      setWorkspace((current) => ({
        ...current,
        subjects: [
          ...current.subjects.filter((subject) => subject.id !== subjectId && (!id || subject.id !== id)),
          optimisticSubject,
        ].sort((first, second) => first.category.localeCompare(second.category) || first.name.localeCompare(second.name)),
      }));

      return runAction(async () => {
        try {
          const response = await requestApi<{ id?: string }>(url, id ? "PATCH" : "POST", item);
          const savedId = id || response.id;
          if (!savedId) throw new Error("বিষয়টি সেভ হয়েছে, কিন্তু তার ID পাওয়া যায়নি।");
          const savedSubject = { ...subjectData, id: savedId };
          setWorkspace((current) => ({
            ...current,
            subjects: [
              ...current.subjects.filter((subject) => subject.id !== subjectId && subject.id !== savedId),
              savedSubject,
            ].sort((first, second) => first.category.localeCompare(second.category) || first.name.localeCompare(second.name)),
          }));
        } catch (saveError) {
          setWorkspace((current) => ({ ...current, subjects: previousSubjects }));
          throw saveError;
        }
      }, successMessage, false);
    }

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

  if (error && workspace.routine.length === 0 && workspace.logs.length === 0 && workspace.tasks.length === 0 && workspace.subjects.length === 0) {
    return <><Header /><MongoConnectionError message={error} /></>;
  }

  const currentSection = activeTab === "dashboard" ? null : sectionMeta[activeTab];

  return (
    <>
      <Header owner />
      <SuccessToast message={message} onClose={closeSuccessToast} />
      {pendingDelete && <DeleteConfirmDialog itemName={pendingDelete.itemName} busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={() => void confirmDelete()} />}
      <main className="manage-shell">
        <div className="manage-shell-glow" aria-hidden="true" />
        <div className="container relative pb-12 pt-4 sm:pb-16 sm:pt-6">
          <div className="space-y-4 sm:space-y-5">
            <WorkspaceHeader />
            <section className="workspace-navigation-shell" aria-label="Management navigation">
              <WorkspaceTabs activeTab={activeTab} onRefresh={() => void refresh()} />
            </section>
            <WorkspaceFeedback error={error} />

            {activeTab === "dashboard" ? (
              <OwnerDashboard
                routine={workspace.routine}
                logs={workspace.logs}
                tasks={workspace.tasks}
                subjects={workspace.subjects}
                busy={busy}
                onRestored={load}
                onReviewed={(log, reviewDate, nextReview) => {
                  const { id, ...data } = log;
                  return saveRecord(
                    "study_logs",
                    { ...data, last_reviewed_date: reviewDate, review_due_date: nextReview },
                    id,
                    "আবার পড়ার হিসাব হয়েছে; ৩ দিন পরে আবার মনে করাবো।",
                  );
                }}
              />
            ) : (
              <section className="workspace-section">
                <header className="workspace-section-header">
                  <div>
                    <p>{currentSection?.eyebrow}</p>
                    <h1>{currentSection?.title}</h1>
                    <span>{currentSection?.description}</span>
                  </div>
                </header>

                <div key={activeTab} className="manage-section-enter">
                  {activeTab === "routine" && <RoutineManager
                    routine={workspace.routine}
                    subjects={workspace.subjects}
                    busy={busy}
                    onSave={(item: RoutineInput, id?: string) => saveRecord(
                      "weekly_routine",
                      item,
                      id,
                      item.category === "ক্লাস রুটিন"
                        ? id ? "ক্লাস রুটিন আপডেট হয়েছে।" : "নতুন ক্লাস যোগ হয়েছে।"
                        : id ? "রুটিন আপডেট হয়েছে।" : "নতুন রুটিন যোগ হয়েছে।",
                    )}
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
                    onSave={(item: StudyLogInput, id?: string) => saveRecord("study_logs", item, id, id ? "পড়ার হিসাব আপডেট হয়েছে।" : item.study_track === "academic" ? "একাডেমিক পড়ার হিসাব সংরক্ষণ হয়েছে।" : item.study_track === "duet_department" ? "DUET Department পড়ার হিসাব সংরক্ষণ হয়েছে।" : "DUET Non-Department পড়ার হিসাব সংরক্ষণ হয়েছে.")}
                    onSaveSubject={(item: SubjectInput, id?: string) => saveRecord("subjects", item, id, id ? "বিষয় আপডেট হয়েছে।" : "DUET বিষয় যোগ হয়েছে।")}
                    onDeleteLog={(id) => requestDelete("study_logs", id)}
                    onDeleteSubject={(id) => requestDelete("subjects", id)}
                  />}
                  {activeTab === "tasks" && <TasksManager
                    tasks={workspace.tasks}
                    subjects={workspace.subjects}
                    busy={busy}
                    onSave={(item: StudyTaskInput, id?: string) => saveRecord("study_tasks", item, id, id ? "কাজ আপডেট হয়েছে।" : "নতুন কাজ যোগ হয়েছে.")}
                    onDelete={(id) => requestDelete("study_tasks", id)}
                  />}
                  {activeTab === "analytics" && <AnalyticsDashboard logs={workspace.logs} tasks={workspace.tasks} subjects={workspace.subjects} />}
                </div>
              </section>
            )}

            <p className="manage-security-note">
              Private workspace · সার্ভার-সাইড authorization দিয়ে সুরক্ষিত
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
