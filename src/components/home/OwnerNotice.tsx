import { LockKeyhole } from "lucide-react";

type OwnerNoticeProps = {
  demoMode: boolean;
};

export default function OwnerNotice({ demoMode }: OwnerNoticeProps) {
  return (
    <section className="mt-12 rounded-2xl border border-green-100 bg-white p-6 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-green-50 text-green-700">
        <LockKeyhole size={20} />
      </span>
      <h2 className="mt-3 font-bold text-green-950">শুধু মালিকের জন্য Edit Access</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        Visitor-রা শুধু প্রকাশিত রুটিন ও বিষয় দেখতে পারবে। ব্যক্তিগত পড়ার লগ, নোট, পরীক্ষা এবং ম্যানেজমেন্ট প্যানেল শুধু অনুমোদিত মালিকের জন্য সংরক্ষিত।
      </p>
      {demoMode && (
        <p className="mt-3 text-xs text-amber-700">
          Demo view: MongoDB সংযোগ না থাকায় প্রাথমিক রুটিন দেখানো হচ্ছে।
        </p>
      )}
    </section>
  );
}
