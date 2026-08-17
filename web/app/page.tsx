import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Download,
  ListChecks,
  MessageSquareText,
  MousePointerClick,
  Rocket,
  ShieldCheck,
  Timer,
  Undo2,
} from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/products";

const SKILL_INSTALL_CMD = "npx skills add AkaraChen/yoi --skill yoi -g";

function HeroTerminal() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-lg bg-terminal text-terminal-foreground shadow-xl shadow-black/10 ring-1 ring-white/10">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-white/40">
            terminal
          </span>
        </div>
        <div className="space-y-3 p-5 font-mono text-[13px] leading-6">
          <p>
            <span className="text-white/40">$</span>{" "}
            <span className="text-white/90">
              npx skills add AkaraChen/yoi --skill yoi -g
            </span>
          </p>
          <p className="text-terminal-ok">✓ yoi skill 已装进 Agent</p>
          <p className="text-white/40">
            # 之后任何时候，跟 Agent 说一句：
          </p>
          <p className="text-terminal-accent">「用 yoi 安装 hermes」</p>
          <p className="text-terminal-ok">
            ✓ pack 已下载 ✓ 服务跑绿
          </p>
          <p>
            <span className="text-white/40">$</span>{" "}
            <span className="inline-block h-4 w-2 translate-y-0.5 animate-blink bg-terminal-foreground" />
          </p>
        </div>
      </div>
    </div>
  );
}

const steps = [
  {
    icon: Download,
    title: "装 Skill（只需一次）",
    body: "npx skills add 把 yoi 装进你的 Agent，它从此学会这套部署流程。",
  },
  {
    icon: MessageSquareText,
    title: "一句话部署",
    body: "跟 Agent 说「用 yoi 安装 <名字>」，它自动拉 Pack、跑参考实现。",
  },
  {
    icon: BadgeCheck,
    title: "人在环跑绿",
    body: "关键步骤等你敲 yes；跑绿后 yoi 记录部署状态，下次接着用。",
  },
];

const features = [
  {
    icon: Rocket,
    title: "网红产品，垂直覆盖",
    body: "OpenClaw、Hermes、LobeHub——网红产品的自建部署，持续追新。",
  },
  {
    icon: ListChecks,
    title: "清单中心，不是黑盒",
    body: "每个 Pack 是清单 + 参考实现 + 验证标准，Agent 照着做，你看得见每一步。",
  },
  {
    icon: Timer,
    title: "三分钟闭环",
    body: "从「想装」到「跑绿」一次走完。任何服务部署都不该是超长周期试错。",
  },
];

const principles = [
  {
    icon: MousePointerClick,
    title: "自愿安装",
    body: "Skill 仅在你明确同意之后才会装入 Agent，没有默认勾选，也没有静默写入。",
  },
  {
    icon: ShieldCheck,
    title: "全程确认",
    body: "安装依赖、执行脚本等关键步骤均需你逐条确认，整个流程对你完全可见。",
  },
  {
    icon: Undo2,
    title: "随时卸载",
    body: "Pack 由纯 Markdown 构成，删除目录即彻底移除，不留下任何残留。",
  },
];

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div>
      <section id="top">
        <div className="container grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-7 animate-fade-up">
            <h1 className="text-display text-5xl leading-[1.08] sm:text-6xl">
              三分钟，
              <br />
              把<span className="text-accent">网红产品</span>跑起来。
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              把 yoi skill 装进你的 Agent，之后只需一句话：「用 yoi 安装
              hermes」。清单、脚本、验证，它都替你带着。
            </p>
            <div className="space-y-3">
              <div
                id="install"
                className="flex max-w-xl scroll-mt-32 items-center gap-2 rounded-lg bg-terminal p-2 pl-5 shadow-md shadow-black/10"
              >
                <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-terminal-foreground">
                  {SKILL_INSTALL_CMD}
                </code>
                <CopyButton
                  text={SKILL_INSTALL_CMD}
                  className="size-9 shrink-0"
                />
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/shop"
                  className="inline-flex h-11 items-center gap-2 rounded-full border bg-secondary/60 px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  浏览 Pack
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <p className="text-xs text-muted-foreground">
                  装进 Agent 只需一次，之后说一句话就行
                </p>
              </div>
            </div>
          </div>
          <div className="animate-fade-up [animation-delay:150ms]">
            <HeroTerminal />
          </div>
        </div>
      </section>

      <section id="packs" className="scroll-mt-24 border-t bg-card/50">
        <div className="container space-y-10 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <h2 className="text-display text-3xl sm:text-4xl">
                全部 Pack
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border bg-secondary/60 px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              查看全部
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-t">
        <div className="container space-y-12 py-20">
          <div className="space-y-3 text-center">
            <h2 className="text-display text-3xl sm:text-4xl">
              三步，之后都是一句话
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative space-y-4 rounded-lg border bg-card p-7 transition-colors hover:bg-secondary/60"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-md bg-secondary text-foreground">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground/60">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-medium">{step.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-secondary/50">
        <div className="container grid gap-10 py-20 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="space-y-3">
              <span className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <feature.icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-lg font-medium">{feature.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t">
        <div className="container space-y-12 py-20">
          <div className="space-y-3 text-center">
            <h2 className="text-display text-3xl sm:text-4xl">
              透明、可控、可逆
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="space-y-3 rounded-lg border border-dashed bg-card/60 p-7"
              >
                <span className="flex size-11 items-center justify-center rounded-md bg-accent/15 text-accent">
                  <principle.icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-lg font-medium">
                  {principle.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="container py-20">
          <div className="relative overflow-hidden rounded-lg bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
            <div className="relative space-y-6">
              <h2 className="text-display text-3xl sm:text-5xl">
                别人三天，你三分钟。
              </h2>
              <p className="mx-auto max-w-md text-primary-foreground/70">
                装上 yoi skill，挑一个 Pack，让你的 Agent 现在就上手。
              </p>
              <Link
                href="#top"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-8 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                安装 Yoi Skill
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
