"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { adminLoginAction, type AdminLoginState } from "@/app/login/actions";

const initialState: AdminLoginState = { error: "" };

export default function AdminLoginForm({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);

  if (!enabled) {
    return <p className="mt-6 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-500">Admin password login এখন বন্ধ। চালু করতে server-side environment-এ OWNER_PASSWORD সেট করো। Google sign-in ব্যবহার করা যাবে।</p>;
  }

  return (
    <form action={formAction} className="mt-6 grid gap-3.5">
      <label className="block">
        <span className="sr-only">Admin email</span>
        <input
          className="field"
          type="email"
          name="email"
          autoComplete="username"
          required
        />
      </label>
      <label className="block">
        <span className="sr-only">Password</span>
        <input
          className="field"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error && <p role="alert" className="text-sm font-semibold text-red-600">{state.error}</p>}
      <button aria-label={pending ? "লগইন হচ্ছে" : "Admin Login"} className="btn btn-primary mt-1 w-full" disabled={pending}>
        <LogIn size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
