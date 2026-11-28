"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AcademicManager from "@/components/manage/AcademicManager";
import AnalyticsDashboard from "@/components/manage/analytics/AnalyticsDashboard";
import CalendarWorkspace from "@/components/manage/CalendarWorkspace";
import DeleteConfirmDialog from "@/components/manage/DeleteConfirmDialog";
import DuetManager from "@/components/manage/DuetManager";
import OwnerDashboard from "@/components/manage/OwnerDashboard";
import PlannerLayout, { type PlannerProfile } from "@/components/manage/PlannerLayout";
import PlannerSettingsPanel from "@/components/manage/PlannerSettingsPanel";
import ProgressWorkspace from "@/components/manage/ProgressWorkspace";
import RoutineManager from "@/components/manage/RoutineManager";
import TasksManager from "@/components/manage/TasksManager";
import { MongoConnectionError, SuccessToast } from "@/components/manage/WorkspaceFeedback";
import type { WorkspaceTab } from "@/components/manage/WorkspaceTabs";
import { requestApi } from "@/lib/owner-api";
import { getDhakaDateKey } from "@/lib/routine-time";
import type { OwnerCollection, OwnerWorkspaceData, RoutineInput, StudyLogInput, StudyTask, StudyTaskInput, SubjectInput } from "@/lib/types";

type ManageWorkspaceProps = {
  activeTab: WorkspaceTab;
  profile: PlannerProfile;
};

const emptyWorkspace: OwnerWorkspaceData = { routine: [], logs: [], tasks: [], subjects: [] };

const sectionMeta: Record<Exclude<WorkspaceTab, "dashboard">, { eyebrow: string; title: string; description: string }> = {
  calendar: {
    eyebrow: "Study calendar",
    title: "ক্যালেন্ডার ও আজকের রুটিন",
    description: "দিনভিত্তিক পড়ার হিসাব ও আজকের সময়সূচি একসাথে দেখো।",
  },
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
  progress: {
    eyebrow: "Study progress",
    title: "তোমার অগ্রগতি",
    description: "সময়, বিষয় এবং কাজের লাইভ অগ্রগতি বুঝে পরের পদক্ষেপ নাও।",
  },
  analytics: {
    eyebrow: "Study insights",
    title: "অগ্রগতির চিত্র",
    description: "সময়, ধারাবাহিকতা ও কাজের অবস্থা বুঝে পরের পদক্ষেপ নাও।",
  },
  settings: {
    eyebrow: "Planner settings",
    title: "Goals, review ও data",
    description: "দৈনিক লক্ষ্য, review reminder এবং নিজের data নিরাপদে নিয়ন্ত্রণ করো।",
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

function PlannerLoading() {
  return (
    <main className="planner-loading-screen" aria-label="Dashboard loading">
      <div className="planner-loading-sidebar" />
      <div className="planner-loading-main">
        <div className="planner-loading-top" />
        <div className="planner-loading-hero" />
        <div className="planner-loading-stats"><i /><i /><i /><i /></div>
        <div className="planner-loading-grid"><i /><i /><i /></div>
      </div>
    </main>
  );
}

export default function ManageWorkspace({ activeTab, profile }: ManageWorkspaceProps) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<OwnerWorkspaceData>(emptyWorkspace);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [themeReady, setThemeReady] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ collection: OwnerCollection; id: string; itemName: string } | null>(null);

  const load = useCallback(async () => {
    const data = await requestApi<OwnerWorkspaceData>("/api/owner");
    setWorkspace(data);
  }, []);

  useEffect(() => {
    setSelectedDate(getDhakaDateKey());
  }, []);

  useEffect(() => {
    setDarkMode(window.localStorage.getItem("study-plan:dark-mode") !== "false");
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.body.classList.toggle("planner-light", !darkMode);
    document.body.classList.toggle("theme-dark-green", darkMode);
    window.localStorage.setItem("study-plan:dark-mode", String(darkMode));
  }, [darkMode, themeReady]);

  useEffect(() => () => {
    document.body.classList.remove("planner-light");
    document.body.classList.add("theme-dark-green");
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

  async function refresh() {
    setError("");
    setMessage("");
    try {
      await load();
      setMessage("Live data আপডেট হয়েছে।");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "সমস্যা হয়েছে।");
    }
  }

  function completeTask(task: StudyTask) {
    const { id, ...data } = task;
    return saveRecord("study_tasks", { ...data, status: "সম্পন্ন" }, id, `“${task.title}” সম্পন্ন হিসেবে চিহ্নিত হয়েছে।`);
  }

  if (!ready) return <PlannerLoading />;

  if (error && workspace.routine.length === 0 && workspace.logs.length === 0 && workspace.tasks.length === 0 && workspace.subjects.length === 0) {
    return <MongoConnectionError message={error} />;
  }

  const currentSection = activeTab === "dashboard" ? null : sectionMeta[activeTab];

  return (
    <>
      <SuccessToast message={message} onClose={() => setMessage("")} />
      {pendingDelete && <DeleteConfirmDialog itemName={pendingDelete.itemName} busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={() => void confirmDelete()} />}
      <PlannerLayout
        activeTab={activeTab}
        profile={profile}
        workspace={workspace}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        onRefresh={() => void refresh()}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((current) => !current)}
      >
        {error && <div className="planner-error-banner" role="alert">{error}</div>}
        {activeTab === "dashboard" ? (
          <OwnerDashboard
            routine={workspace.routine}
            logs={workspace.logs}
            tasks={workspace.tasks}
            subjects={workspace.subjects}
            selectedDate={selectedDate}
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
            onCompleteTask={completeTask}
          />
        ) : (
          <section className="planner-section-view">
            <header className="planner-section-heading">
              <p>{currentSection?.eyebrow}</p>
              <h1>{currentSection?.title}</h1>
              <span>{currentSection?.description}</span>
            </header>
            <div key={activeTab} className="manage-section-enter">
              {activeTab === "calendar" && <CalendarWorkspace logs={workspace.logs} />}
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
              {activeTab === "progress" && <ProgressWorkspace logs={workspace.logs} tasks={workspace.tasks} subjects={workspace.subjects} />}
              {activeTab === "analytics" && <AnalyticsDashboard logs={workspace.logs} tasks={workspace.tasks} subjects={workspace.subjects} />}
              {activeTab === "settings" && <PlannerSettingsPanel
                logs={workspace.logs}
                busy={busy}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode((current) => !current)}
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
              />}
            </div>
          </section>
        )}
      </PlannerLayout>
    </>
  );
}
