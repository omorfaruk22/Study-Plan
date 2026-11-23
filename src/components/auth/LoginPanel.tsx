import { signIn } from "@/auth";
import { BookOpen, Chrome } from "lucide-react";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

export default function LoginPanel() {
  const adminLoginEnabled = Boolean(process.env.OWNER_PASSWORD);

  return (
    <main className="login-stage relative isolate grid min-h-[calc(100vh-72px)] place-items-center overflow-hidden py-10 sm:py-12">
      <div className="container relative z-10 grid w-full place-items-center">
        <section className="login-panel card w-full max-w-md p-6 animate-rise sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-200 text-green-900">
            <BookOpen size={27} />
          </div>
          <h1 className="mt-4 text-center text-2xl font-extrabold text-green-950">Owner Login</h1>

          <AdminLoginForm enabled={adminLoginEnabled} />

          <form action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/manage" });
          }} className="mt-4">
            <button aria-label="Sign in with Google" className="btn btn-plain w-full border-green-500/25">
              <Chrome size={19} aria-hidden="true" />
            </button>
          </form>

        </section>
      </div>
    </main>
  );
}
