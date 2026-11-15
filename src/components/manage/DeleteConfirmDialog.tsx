"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

type DeleteConfirmDialogProps = {
  itemName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmDialog({ itemName, busy, onCancel, onConfirm }: DeleteConfirmDialogProps) {
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButton.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && !busy) onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-green-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
      onKeyDown={handleKeyDown}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="w-full max-w-md overflow-hidden rounded-[26px] border border-green-100 bg-white shadow-2xl shadow-green-950/30 animate-rise"
      >
        <div className="h-2 bg-gradient-to-r from-green-800 via-emerald-500 to-lime-300" />
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <AlertTriangle size={24} />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-green-700">একবার দেখে নাও</p>
              <h2 id="delete-dialog-title" className="mt-1 text-xl font-black text-green-950">এটা মুছে ফেলবে?</h2>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/80 p-4">
            <p className="text-xs font-semibold text-green-700">যে তথ্যটি মুছবে</p>
            <p className="mt-1 break-words text-sm font-bold text-green-950">{itemName}</p>
          </div>
          <p id="delete-dialog-description" className="mt-4 text-sm leading-6 text-slate-500">
            মুছে দিলে এই তথ্যটি আর Study Management-এ থাকবে না।
          </p>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button ref={cancelButton} type="button" disabled={busy} onClick={onCancel} className="btn btn-plain">
              রেখে দাও
            </button>
            <button type="button" disabled={busy} onClick={onConfirm} className="btn bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60">
              <Trash2 size={16} /> {busy ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলো"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
