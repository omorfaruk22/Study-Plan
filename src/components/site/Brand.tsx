import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Brand() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 no-underline sm:gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-700 text-white sm:h-10 sm:w-10">
        <BookOpen size={21} />
      </span>
      <span className="min-w-0">
        <b className="block whitespace-nowrap text-[14px] text-green-950 sm:text-[15px]">
          Study<span className="text-green-600">Plan</span>
        </b>
        <small className="hidden text-[11px] text-slate-500 sm:block">PERSONAL STUDY PLAN</small>
      </span>
    </Link>
  );
}
