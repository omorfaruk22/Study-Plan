import { LockKeyhole, Quote, ShieldCheck } from "lucide-react";

type OwnerNoticeProps = {
  dataUnavailable: boolean;
};

export default function OwnerNotice({ dataUnavailable }: OwnerNoticeProps) {
  return (
    <section id="about" className="public-about-section" aria-labelledby="public-about-title">
      <div className="public-quote-card">
        <Quote size={31} />
        <blockquote>“নিয়মিত পড়াই<br /><strong>সাফল্যের চাবিকাঠি।”</strong></blockquote>
        <span>– StudyPlan</span>
      </div>
      <div className="public-owner-card">
        <span><LockKeyhole size={22} /></span>
        <div>
          <p><ShieldCheck size={14} /> Private study space</p>
          <h2 id="public-about-title">শুধু মালিকের জন্য Edit Access</h2>
          <div>Visitor-রা প্রকাশিত রুটিন, বিষয় এবং মোট পড়ার পরিসংখ্যান দেখতে পারবে। বিস্তারিত পড়ার লগ, নোট, পরীক্ষা এবং ম্যানেজমেন্ট প্যানেল শুধু অনুমোদিত মালিকের জন্য সংরক্ষিত।</div>
          {dataUnavailable && <small>Live study data এখন পাওয়া যাচ্ছে না, তাই কোনো নমুনা রুটিন দেখানো হচ্ছে না।</small>}
        </div>
      </div>
    </section>
  );
}
