"use client";

import Header from "@/components/Header";
import OwnerNotice from "@/components/home/OwnerNotice";
import PublicReveal from "@/components/home/PublicReveal";
import PublicRoutine from "@/components/home/PublicRoutine";
import PublicStudyStats from "@/components/home/PublicStudyStats";
import StudyFocusCards from "@/components/home/StudyFocusCards";
import StudyHero from "@/components/home/StudyHero";
import SubjectList from "@/components/home/SubjectList";
import TodayClassRoutine from "@/components/home/TodayClassRoutine";
import { usePublicStudyData } from "@/hooks/usePublicStudyData";

export default function PublicHomePage() {
  const { routine, subjects, studyStats, loading, dataUnavailable } = usePublicStudyData();

  return (
    <div className="public-site">
      <Header publicMode />
      <main className="public-main">
        <div className="public-container public-page-shell">
          <StudyHero />
          <PublicReveal delay={40}>
            <PublicStudyStats
              stats={studyStats}
              subjectCount={subjects.length}
              routineCount={routine.length}
              loading={loading}
              dataUnavailable={dataUnavailable}
            />
          </PublicReveal>
          <PublicReveal delay={70}>
            <StudyFocusCards routine={routine} subjects={subjects} loading={loading} dataUnavailable={dataUnavailable} />
          </PublicReveal>
          <PublicReveal delay={90}>
            <TodayClassRoutine routine={routine} loading={loading} dataUnavailable={dataUnavailable} />
          </PublicReveal>
          <PublicReveal delay={110}>
            <PublicRoutine routine={routine} subjects={subjects} loading={loading} dataUnavailable={dataUnavailable} />
          </PublicReveal>
          <div className="public-lower-grid">
            <PublicReveal delay={120}>
              <SubjectList subjects={subjects} loading={loading} dataUnavailable={dataUnavailable} />
            </PublicReveal>
            <PublicReveal delay={160}>
              <OwnerNotice dataUnavailable={dataUnavailable} />
            </PublicReveal>
          </div>
        </div>
      </main>
      <footer className="public-footer">
        <div className="public-container">© {new Date().getFullYear()} StudyPlan · Plan · Study · Achieve</div>
      </footer>
    </div>
  );
}
