import { BookOpen, CalendarDays, Clock3 } from "lucide-react";

const studyAreas = [
  { icon: BookOpen, title: "কলেজের পড়া", description: "প্রতিদিনের ক্লাস ও CGPA ফোকাস" },
  { icon: CalendarDays, title: "DUET প্রস্তুতি", description: "Non-Department ও Department" },
  { icon: Clock3, title: "Web Development", description: "নিয়মিত শেখা ও প্র্যাকটিস" },
];

export default function StudyFocusCards() {
  return (
    <section aria-label="Study areas" className="mt-7 grid gap-4 sm:grid-cols-3">
      {studyAreas.map(({ icon: Icon, title, description }) => (
        <article key={title} className="card flex items-center gap-3 p-3.5 sm:gap-4 sm:p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700">
            <Icon size={21} />
          </span>
          <div>
            <b className="text-sm">{title}</b>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
