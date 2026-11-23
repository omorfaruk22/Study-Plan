"use client";

import Header from "@/components/Header";
import LiveClocks from "@/components/home/LiveClocks";
import OwnerNotice from "@/components/home/OwnerNotice";
import PublicRoutine from "@/components/home/PublicRoutine";
import PublicStudyStats from "@/components/home/PublicStudyStats";
import StudyFocusCards from "@/components/home/StudyFocusCards";
import StudyHero from "@/components/home/StudyHero";
import SubjectList from "@/components/home/SubjectList";
import TodayClassRoutine from "@/components/home/TodayClassRoutine";
import { usePublicStudyData } from "@/hooks/usePublicStudyData";

export default function PublicHomePage() {
  const { routine, subjects, studyStats, loading, demoMode } = usePublicStudyData();

  return (
    <>
      <Header />
      <main className="container pb-16 pt-4 sm:pt-6">
        <div className="mb-4 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-stretch">
          <LiveClocks />
          <TodayClassRoutine routine={routine} loading={loading} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
          <StudyHero />
          <PublicStudyStats stats={studyStats} loading={loading} />
        </div>
        <StudyFocusCards />
        <PublicRoutine routine={routine} subjects={subjects} loading={loading} />
        <SubjectList subjects={subjects} />
        <OwnerNotice demoMode={demoMode} />
        <footer className="mt-10 border-t border-green-100 pt-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Faruk Study Manager · Built for consistent learning
        </footer>
      </main>
    </>
  );
}
