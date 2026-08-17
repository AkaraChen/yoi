import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yoi",
  description: "网红 agent 产品的介绍站。先看产品，再谈部署。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <a className="brand" href="/">
            Yoi
          </a>
          {children}
        </div>
      </body>
    </html>
  );
}
