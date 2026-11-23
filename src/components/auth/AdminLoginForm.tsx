"use client";

import { useActionState } from "react";
import { AtSign, KeyRound, LogIn } from "lucide-react";
import { adminLoginAction, type AdminLoginState } from "@/app/login/actions";

const initialState: AdminLoginState = { error: "" };

export default function AdminLoginForm({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  if (!enabled) {
    return <p className="mt-6 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-500">Admin password login এখন বন্ধ। চালু করতে server-side environment-এ OWNER_PASSWORD সেট করো। Google sign-in ব্যবহার করা যাবে।</p>;
  }

  return (
    <form action={formAction} className="mt-6 grid gap-3.5">
      <label className="relative block">
        <span className="sr-only">Admin email</span>
        <AtSign size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600/70" />
        <input
          className="field pl-11"
          type="email"
          name="email"
          autoComplete="username"
          placeholder="name@example.com"
          required
        />
      </label>
      <label className="relative block">
        <span className="sr-only">Password</span>
        <KeyRound size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600/70" />
        <input
          className="field pl-11"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          required
        />
      </label>
      {state.error && <p role="alert" className="text-sm font-semibold text-red-600">{state.error}</p>}
      <button className="btn btn-primary mt-1 w-full" disabled={pending}>
        <LogIn size={17} /> {pending ? "লগইন হচ্ছে…" : "Admin Login"}
      </button>
    </form>
  );
}
