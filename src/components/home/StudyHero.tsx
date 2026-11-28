import Link from "next/link";
import { ArrowRight, BookOpenCheck, Sparkles } from "lucide-react";

export default function StudyHero() {
  return (
    <section className="public-hero" aria-labelledby="public-hero-title">
      <div className="public-hero-image" aria-hidden="true" />
      <div className="public-hero-rings" aria-hidden="true"><i /><i /></div>
      <div className="public-hero-content">
        <p className="public-hero-kicker"><Sparkles size={16} /> Your Personal Study Planner</p>
        <h1 id="public-hero-title">
          আমার পড়াশোনা,<br />
          <em>আমার পরিকল্পনায়!</em>
        </h1>
        <p className="public-hero-description">
          নিজের পড়াশোনাকে করুন আরও সংগঠিত, আরও কার্যকর এবং আরও লক্ষ্যভিত্তিক।
        </p>
        <div className="public-hero-actions">
          <Link href="#routine" className="public-hero-primary">
            <BookOpenCheck size={18} /> আজকের রুটিন দেখুন <ArrowRight size={16} />
          </Link>
          <a href="#about" className="public-hero-secondary">
            বিস্তারিত জানুন
          </a>
        </div>
      </div>
    </section>
  );
}
