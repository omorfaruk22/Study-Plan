import { signIn } from "@/auth";
import { BookOpen, Chrome, ShieldCheck } from "lucide-react";

export default function LoginPanel() {
  return (
    <main className="container grid min-h-[calc(100vh-72px)] place-items-center py-12">
      <div className="card w-full max-w-md p-7 sm:p-9 animate-rise">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-green-800">
          <BookOpen size={27} />
        </div>
        <h1 className="mt-5 text-center text-2xl font-extrabold text-green-950">Owner Login</h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          নিজের পড়াশোনার তথ্য ম্যানেজ করতে অনুমোদিত Google Account দিয়ে প্রবেশ করো।
        </p>
        <form action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/manage" });
        }}>
          <button className="btn btn-primary mt-7 w-full">
            <Chrome size={18} /> Continue with Google
          </button>
        </form>
        <div className="mt-6 rounded-xl bg-green-50 p-4 text-xs leading-6 text-green-900">
          <ShieldCheck size={16} className="mr-1 inline" />
          শুধু OWNER_EMAIL-এ নির্ধারিত verified Google account প্রবেশ করতে পারবে।
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">
          Visitor? <a className="font-bold text-green-700" href="/">Public routine দেখো</a>
        </p>
      </div>
    </main>
  );
}
