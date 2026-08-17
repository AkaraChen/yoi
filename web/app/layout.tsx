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

function Shell({ children }: { children: ReactNode }) {
  return <div className="w-full px-6">{children}</div>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <header>
          <Shell>
            <div className="flex h-14 items-center justify-between">
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
          </Shell>
          <Separator />
        </header>
        <main className="py-10">
          <Shell>{children}</Shell>
        </main>
        <footer>
          <Separator />
          <Shell>
            <div className="py-6 text-sm text-muted-foreground">Yoi</div>
          </Shell>
        </footer>
      </body>
    </html>
  );
}
