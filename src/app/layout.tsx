import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Target Intelligence Engine",
  description: "Evidence-first goal workspace for structured planning."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
