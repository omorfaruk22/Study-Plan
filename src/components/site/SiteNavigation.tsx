"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CalendarDays, CircleHelp, House, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";

type SiteNavigationProps = {
  owner?: boolean;
  publicMode?: boolean;
};

export default function SiteNavigation({ owner = false, publicMode = false }: SiteNavigationProps) {
  const [pending, startTransition] = useTransition();

  function logOut() {
    startTransition(() => {
      void logoutAction();
    });
  }

  if (publicMode) {
    return (
      <nav aria-label="Public navigation" className="public-navigation">
        <Link href="/" className="public-nav-link" aria-label="হোম">
          <House size={16} /> <span>হোম</span>
        </Link>
        <Link href="/#routine" className="public-nav-link">
          <CalendarDays size={16} /> <span>Daily Routine</span>
        </Link>
        <a href="#about" className="public-nav-link">
          <CircleHelp size={16} /> <span>About</span>
        </a>
        <Link href="/login" className="public-owner-login">
          <LogIn size={16} /> <span>Owner Login</span>
        </Link>
      </nav>
    );
  }

  return (
    <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-1 min-[440px]:gap-2">
      <Link
        href="/"
        className="hidden rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20 hover:text-green-200 sm:block"
      >
        Daily Routine
      </Link>

      {owner ? (
        <>
          <Link
            href="/manage"
            aria-label="Manage"
            title="Manage"
            className="btn btn-soft gap-1.5 px-2.5 text-xs min-[440px]:px-3 min-[440px]:text-sm"
          >
            <LayoutDashboard size={16} /> <span className="hidden min-[440px]:inline">Manage</span>
          </Link>
          <button
            type="button"
            aria-label={pending ? "Logging out" : "Logout"}
            title="Logout"
            disabled={pending}
            onClick={logOut}
            className="btn btn-plain gap-1.5 px-2.5 text-xs min-[440px]:px-3 min-[440px]:text-sm"
          >
            <LogOut size={16} />
            <span className="hidden min-[440px]:inline">{pending ? "Logout..." : "Logout"}</span>
          </button>
        </>
      ) : (
        <Link href="/login" className="btn btn-primary gap-1.5 px-3 text-xs min-[380px]:text-sm">
          <LogIn size={16} /> Owner Login
        </Link>
      )}
    </nav>
  );
}
