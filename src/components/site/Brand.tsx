import Link from "next/link";
import { BookOpen } from "lucide-react";

type BrandProps = {
  publicMode?: boolean;
};

export default function Brand({ publicMode = false }: BrandProps) {
  return (
    <Link href="/" className={publicMode ? "public-brand" : "flex min-w-0 items-center gap-2 no-underline sm:gap-3"}>
      <span className={publicMode ? "public-brand-mark" : "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-700 text-white sm:h-10 sm:w-10"}>
        <BookOpen size={publicMode ? 27 : 21} />
      </span>
      <span className="min-w-0">
        <b className={publicMode ? "public-brand-title" : "block whitespace-nowrap text-[14px] text-green-950 sm:text-[15px]"}>
          Study<span className={publicMode ? undefined : "text-green-600"}>Plan</span>
        </b>
        <small className={publicMode ? "public-brand-tagline" : "hidden text-[11px] text-slate-500 sm:block"}>
          {publicMode ? "Plan · Study · Achieve" : "PERSONAL STUDY PLAN"}
        </small>
      </span>
    </Link>
  );
}
