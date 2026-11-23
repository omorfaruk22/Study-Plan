import { signIn } from "@/auth";
import { BookOpen, Chrome, ShieldCheck } from "lucide-react";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

export default function LoginPanel() {
  const adminLoginEnabled = Boolean(process.env.OWNER_PASSWORD);

  return (
    <main className="relative isolate grid min-h-[calc(100vh-72px)] place-items-center overflow-hidden py-10 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-[110px] sm:h-[38rem] sm:w-[38rem]" />
        <div className="absolute left-[calc(50%+9rem)] top-[18%] h-52 w-52 rounded-full bg-lime-400/5 blur-[90px]" />
      </div>

      <div className="container relative z-10 grid w-full place-items-center">
        <section className="card w-full max-w-md p-6 animate-rise sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-green-800">
            <BookOpen size={27} />
          </div>
          <h1 className="mt-4 text-center text-2xl font-extrabold text-green-950">Owner Login</h1>
          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            Admin account দিয়ে প্রবেশ করো অথবা Google ব্যবহার করো।
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.13em] text-green-700">
            <ShieldCheck size={15} /> Admin Login
          </div>
          <AdminLoginForm enabled={adminLoginEnabled} />

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-green-900/10" />
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">অথবা</span>
            <span className="h-px flex-1 bg-green-900/10" />
          </div>

          <form action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/manage" });
          }}>
            <button className="btn btn-plain w-full border-green-500/25">
              <Chrome size={18} /> Sign in with Google
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-green-50 p-3 text-[11px] leading-5 text-green-900">
            <ShieldCheck size={14} className="mr-1 inline" />
            দুই login পদ্ধতিই একই অনুমোদিত owner email-এ সীমাবদ্ধ।
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">
            Visitor? <a className="font-bold text-green-700" href="/">Public routine দেখো</a>
          </p>
        </section>
      </div>
    </main>
  );
}
