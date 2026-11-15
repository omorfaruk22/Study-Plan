import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Faruk Study Manager | Personal Study Planner",
  description: "A personal study management website for routine, daily study logs, subjects and deadlines.",
  robots: { index: true, follow: true }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bn"><body>{children}</body></html>;
}
