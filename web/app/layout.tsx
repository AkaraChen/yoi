import type { ReactNode } from "react";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "Yoi — 面向 Agent 的部署技能商店",
  description:
    "把 yoi skill 装进你的 Agent，三分钟把网红产品在自己的 Linux 上跑起来。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
