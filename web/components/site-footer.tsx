import Link from "next/link";

const columns = [
  {
    title: "Pack",
    links: [
      { label: "全部 Pack", href: "/shop" },
      { label: "使用方式", href: "/#how-it-works" },
    ],
  },
  {
    title: "资源",
    links: [
      { label: "GitHub", href: "https://github.com/AkaraChen/yoi" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="text-2xl font-bold tracking-tight">
            Yoi<span className="text-accent">.</span>
          </p>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            面向编码 Agent 的部署技能商店。每个 Pack 是一个网红产品的完整部署指南，
            一句话跑起来。
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="space-y-4">
            <p className="text-sm font-medium text-foreground/80">
              {col.title}
            </p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="container flex h-14 items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Yoi</span>
          <span>三分钟跑起来，不是三天。</span>
        </div>
      </div>
    </footer>
  );
}
