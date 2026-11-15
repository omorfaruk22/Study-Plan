import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 no-underline">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-700 text-white">
        <BookOpen size={21} />
      </span>
      <span>
        <b className="block text-[15px] text-green-950">
          Study<span className="text-green-600">Plan</span>
        </b>
        <small className="text-[11px] text-slate-500">PERSONAL STUDY PLAN</small>
      </span>
    </Link>
  );
}
