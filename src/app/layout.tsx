import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "目标情报引擎",
  description: "以证据为先的目标分析工作台。"
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
