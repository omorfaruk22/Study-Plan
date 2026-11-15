"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";

type SiteNavigationProps = {
  owner?: boolean;
};

export default function SiteNavigation({ owner = false }: SiteNavigationProps) {
  const [pending, startTransition] = useTransition();

  function logOut() {
    startTransition(() => {
      void logoutAction();
    });
  }

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-2">
      <Link
        href="/"
        className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-green-50 sm:block"
      >
        Public Routine
      </Link>

      {owner ? (
        <>
          <Link href="/manage" className="btn btn-soft text-sm">
            <LayoutDashboard size={16} /> Manage
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={logOut}
            className="btn btn-plain text-sm"
          >
            <LogOut size={16} /> {pending ? "Logout..." : "Logout"}
          </button>
        </>
      ) : (
        <Link href="/login" className="btn btn-primary text-sm">
          <LogIn size={16} /> Owner Login
        </Link>
      )}
    </nav>
  );
}
