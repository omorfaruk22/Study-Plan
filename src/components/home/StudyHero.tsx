import Link from "next/link";
import { ArrowRight, Eye, Sparkles } from "lucide-react";

export default function StudyHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-green-950 via-green-800 to-green-700 px-7 py-10 text-white shadow-xl shadow-green-900/10 animate-rise md:px-12 md:py-14">
      <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border-[38px] border-white/5" />
      <div className="absolute bottom-[-90px] right-[20%] h-52 w-52 rounded-full bg-lime-300/10 blur-2xl" />

      <div className="relative max-w-2xl">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-green-100">
          <Sparkles size={14} /> Personal Study Manager
        </span>
        <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
          আমার পড়াশোনা,<br />
          <span className="text-lime-300">আমার পরিকল্পনায়।</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-green-100 md:text-base">
          কলেজের একাডেমিক পড়া, DUET প্রস্তুতি এবং Web Development—সবকিছু এক জায়গায় গুছিয়ে রাখার ব্যক্তিগত স্টাডি স্পেস।
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/login" className="btn bg-lime-300 text-green-950 hover:bg-lime-200">
            নিজের পড়া ম্যানেজ করো <ArrowRight size={17} />
          </Link>
          <a href="#routine" className="btn border border-white/25 bg-white/10 text-white hover:bg-white/15">
            <Eye size={17} /> রুটিন দেখো
          </a>
        </div>
      </div>
    </section>
  );
}
