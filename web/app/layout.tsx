import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  title: "Yoi",
  description: "产品介绍商品。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <header>
          <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="text-sm font-semibold">
              Yoi
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                商品
              </Link>
            </nav>
          </div>
          <Separator />
        </header>
        <main className="container py-10">{children}</main>
        <footer>
          <Separator />
          <div className="container py-6 text-sm text-muted-foreground">
            Yoi
          </div>
        </footer>
      </body>
    </html>
  );
}
