import { signIn } from "@/auth";
import { BookOpen, Chrome, ShieldCheck } from "lucide-react";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

export default function LoginPanel() {
  const adminLoginEnabled = Boolean(process.env.OWNER_PASSWORD);

  return (
    <main className="container grid min-h-[calc(100vh-72px)] place-items-center py-10 sm:py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-green-800">
            <BookOpen size={27} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-green-950">Owner Login</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Google দিয়ে প্রবেশ করো অথবা Admin account ব্যবহার করো।</p>
        </div>

        <div className="grid items-stretch gap-4 md:grid-cols-2">
          <section className="card flex flex-col p-6 sm:p-8">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-100 text-green-800">
              <Chrome size={21} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-green-950">Sign in with Google</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
              অনুমোদিত verified Google account দিয়ে নিরাপদে প্রবেশ করো।
            </p>
            <form action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/manage" });
            }} className="mt-auto pt-5">
              <button className="btn btn-primary w-full">
                <Chrome size={18} /> Continue with Google
              </button>
            </form>
          </section>

          <section className="card p-6 sm:p-8">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-100 text-green-800">
              <ShieldCheck size={21} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-green-950">Admin Login</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              OWNER_EMAIL এবং server-এ সেট করা password ব্যবহার করো।
            </p>
            <AdminLoginForm enabled={adminLoginEnabled} />
          </section>
        </div>

        <div className="mt-4 rounded-xl bg-green-50 p-4 text-xs leading-6 text-green-900">
          <ShieldCheck size={16} className="mr-1 inline" />
          দুই login পদ্ধতিই একই অনুমোদিত owner email-এ সীমাবদ্ধ। Admin password শুধু server-side environment থেকে পড়া হয়।
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">
          Visitor? <a className="font-bold text-green-700" href="/">Public routine দেখো</a>
        </p>
      </div>
    </main>
  );
}
