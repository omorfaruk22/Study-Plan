import Link from "next/link";
import { Eye } from "lucide-react";

export default function WorkspaceHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-green-700">Owner workspace</p>
        <h1 className="mt-1 text-2xl font-black text-green-950 sm:text-3xl">Study Management</h1>
        <p className="mt-1 text-sm text-slate-500">তোমার পড়াশোনার সবকিছু এখান থেকে নিয়ন্ত্রণ করো।</p>
      </div>
      <Link href="/" className="btn btn-plain text-sm">
        <Eye size={16} /> Public View
      </Link>
    </div>
  );
}
