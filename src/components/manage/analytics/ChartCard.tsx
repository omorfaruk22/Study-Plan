import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <article className="card min-w-0 p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="font-extrabold text-green-950">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </header>
      {children}
    </article>
  );
}
