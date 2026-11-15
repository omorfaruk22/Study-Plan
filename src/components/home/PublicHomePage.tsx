"use client";

import Header from "@/components/Header";
import OwnerNotice from "@/components/home/OwnerNotice";
import PublicRoutine from "@/components/home/PublicRoutine";
import StudyFocusCards from "@/components/home/StudyFocusCards";
import StudyHero from "@/components/home/StudyHero";
import SubjectList from "@/components/home/SubjectList";
import { usePublicStudyData } from "@/hooks/usePublicStudyData";

export default function PublicHomePage() {
  const { routine, subjects, loading, demoMode } = usePublicStudyData();

  return (
    <>
      <Header />
      <main className="container pb-16 pt-10">
        <StudyHero />
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
