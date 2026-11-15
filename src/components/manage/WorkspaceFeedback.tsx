"use client";

import { useEffect } from "react";
import { CheckCircle2, Sparkles, X } from "lucide-react";

export function WorkspaceFeedback({ error }: { error: string }) {
  if (!error) return null;

  return (
    <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {error}
    </div>
  );
}

type SuccessToastProps = {
  message: string;
  onClose: () => void;
};

export function SuccessToast({ message, onClose }: SuccessToastProps) {
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[80] w-[min(92vw,390px)] animate-rise" role="status" aria-live="polite">
      <div className="relative overflow-hidden rounded-2xl border border-green-100 bg-white shadow-2xl shadow-green-950/20">
        <div className="h-1.5 bg-gradient-to-r from-green-700 via-emerald-400 to-lime-300" />
        <div className="flex items-start gap-3 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-100 text-green-700 ring-1 ring-green-200">
            <CheckCircle2 size={23} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-green-700">
              <Sparkles size={12} /> Study Manager · সম্পন্ন
            </p>
            <p className="mt-1 text-sm font-bold leading-5 text-green-950">{message}</p>
            <p className="mt-1 text-xs text-slate-500">পরিবর্তনটি সফলভাবে সম্পন্ন হয়েছে।</p>
          </div>
          <button type="button" onClick={onClose} aria-label="বার্তা বন্ধ করুন" className="rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-800">
            <X size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MongoConnectionError({ message }: { message: string }) {
  return (
    <main className="container py-20">
      <div className="card mx-auto max-w-xl p-7 text-center">
        <h1 className="text-xl font-bold text-green-950">MongoDB সংযোগ প্রয়োজন</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        <p className="mt-3 text-xs text-slate-400">
          README.md-এর MongoDB Atlas ও Environment Variables নির্দেশনা অনুসরণ করো।
        </p>
      </div>
    </main>
  );
}
