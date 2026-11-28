import { BookOpen, Sparkles } from "lucide-react";
import type { Subject } from "@/lib/types";

type SubjectListProps = {
  subjects: Subject[];
  loading: boolean;
  dataUnavailable: boolean;
};

export default function SubjectList({ subjects, loading, dataUnavailable }: SubjectListProps) {
  return (
    <section id="subjects" className="public-subject-section" aria-labelledby="public-subject-title">
      <header className="public-section-heading public-subject-heading">
        <div>
          <p><BookOpen size={16} /> Subject collection</p>
          <h2 id="public-subject-title">বিষয় তালিকা</h2>
          <span>আপনার প্রকাশিত বিষয়গুলো এক নজরে দেখুন।</span>
        </div>
        <span className="public-subject-count">{dataUnavailable ? "তথ্য পাওয়া যাচ্ছে না" : `${subjects.length}টি বিষয়`}</span>
      </header>

      {loading ? (
        <div className="public-subject-loading" aria-label="বিষয় তালিকা লোড হচ্ছে">
          {Array.from({ length: 4 }, (_, index) => <i key={index} />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="public-subject-empty">
          <Sparkles size={23} />
          <div><strong>{dataUnavailable ? "লাইভ বিষয় তালিকা পাওয়া যাচ্ছে না" : "এখনো কোনো বিষয় যোগ করা হয়নি"}</strong><span>{dataUnavailable ? "সংযোগ ফিরলে শুধু সংরক্ষিত বিষয়গুলো দেখা যাবে।" : "বিষয় যোগ হলে এই অংশটি স্বয়ংক্রিয়ভাবে আপডেট হবে।"}</span></div>
        </div>
      ) : (
        <div className="public-subject-grid">
          {subjects.map((subject, index) => (
            <article key={subject.id} className={`public-subject-card tone-${index % 4}`}>
              <span className="public-subject-icon"><BookOpen size={19} /></span>
              <div>
                <p>{subject.category}{subject.code ? ` · ${subject.code}` : ""}</p>
                <h3>{subject.name}</h3>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
