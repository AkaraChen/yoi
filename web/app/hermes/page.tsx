import type { Metadata } from "next";
import Link from "next/link";

import { getPost } from "@/lib/posts";

const post = getPost("hermes");

export const metadata: Metadata = {
  title: "Hermes · Yoi",
  description: post?.excerpt,
};

export default function HermesPage() {
  return (
    <article className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            文章
          </Link>
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Hermes</h1>
        <time dateTime="2026-08-17" className="block text-sm text-muted-foreground">
          2026-08-17
        </time>
      </div>
      <div className="space-y-4 text-base leading-7">
        <p>
          Hermes 是 Nous Research 做的命令行 agent。人在终端里跟它说话，它去调你选好的模型。
          第一版有用的面是这一段对话，不是接到 Telegram 或 Discord 上的网关。
        </p>
        <h2 className="text-xl font-semibold tracking-tight">它是什么</h2>
        <p>
          一个装在你自己机器上的对话入口。你带着问题进来，它用你选的模型回答，并在需要时调用工具。
          上游是{" "}
          <a
            className="underline underline-offset-4"
            href="https://github.com/NousResearch/hermes-agent"
          >
            NousResearch/hermes-agent
          </a>
          ，说明在{" "}
          <a
            className="underline underline-offset-4"
            href="https://hermes-agent.nousresearch.com/docs/getting-started/quickstart"
          >
            官方入门页
          </a>
          。
        </p>
        <h2 className="text-xl font-semibold tracking-tight">模型怎么选</h2>
        <p>模型入口要你自己准备。没有入口就先停，不要让别人代你申请或代填密钥。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nous Portal：在 Hermes 里走设置，用官方门户。</li>
          <li>自带密钥：OpenRouter、OpenAI 等，由你自己粘贴。</li>
        </ul>
        <p>选完应能发出一句对话。网关、定时任务、技能市场都不是这一步。</p>
        <h2 className="text-xl font-semibold tracking-tight">对话怎么算可用</h2>
        <p>同时满足这三条，这段对话才算可用：</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>能打开 Hermes。</li>
          <li>它能正常显示帮助，没有立刻报错退出。</li>
          <li>你发出一句对话，并且模型有回应。</li>
        </ol>
      </div>
    </article>
  );
}
