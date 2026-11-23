"use client";

import { useActionState } from "react";
import { KeyRound, LogIn } from "lucide-react";
import { adminLoginAction, type AdminLoginState } from "@/app/login/actions";

const initialState: AdminLoginState = { error: "" };

export default function AdminLoginForm({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  if (!enabled) {
    return <p className="mt-6 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-500">Admin password login এখন বন্ধ। চালু করতে server-side environment-এ OWNER_PASSWORD সেট করো। Google sign-in ব্যবহার করা যাবে।</p>;
  }

  return (
    <form action={formAction} className="mt-6 grid gap-3">
      <label className="grid gap-1.5">
        <span className="label">Admin email</span>
        <input
          className="field"
          type="email"
          name="email"
          autoComplete="username"
          placeholder="admin@example.com"
          required
        />
      </label>
      <label className="grid gap-1.5">
        <span className="label">Password</span>
        <input
          className="field"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Admin password"
          required
        />
      </label>
      {state.error && <p role="alert" className="text-sm font-semibold text-red-600">{state.error}</p>}
      <button className="btn btn-primary mt-1 w-full" disabled={pending}>
        <LogIn size={17} /> {pending ? "লগইন হচ্ছে…" : "Admin Login"}
      </button>
      <p className="flex items-start gap-1.5 text-[11px] leading-5 text-slate-500">
        <KeyRound size={13} className="mt-0.5 shrink-0" /> Admin password server-side environment variable-এ রাখা হয়।
      </p>
    </form>
  );
}
