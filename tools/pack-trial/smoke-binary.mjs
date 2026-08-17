#!/usr/bin/env node
// Binary-distribution smoke test: how fast can a fresh sandbox get a working
// yoi CLI now that install.sh + GitHub Release assets exist?
//
//   node smoke-binary.mjs [--keep] [--timeout-min N]
//
// Measures wall time from container start until "v0.1.0" appears anywhere in
// the session event stream (i.e. `yoi --version` worked), plus question count,
// tool calls, and whether install.sh was used vs the go install fallback.
// Artifacts: trials/smoke-<ts>/{events.jsonl,transcript.md,metrics.json}.

import { SandboxAgent } from "sandbox-agent";
import { Agent as UndiciAgent, fetch as undiciFetch } from "undici";
import { execFileSync } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const IMAGE = "rivetdev/sandbox-agent:0.4.2-full";
const dispatcher = new UndiciAgent({ headersTimeout: 0, bodyTimeout: 0 });
const MAX_QUESTIONS = 4;
const TURN_TIMEOUT_MS = 10 * 60_000;
const VERSION_RE = /v0\.1\.0/;

const AUTO_REPLY = "是，继续。如果遇到选项，按推荐或默认的选，不用等我。";
const QUESTION_RE =
  /[?？]|吗[。，!！]?$|请(你|您|问)|需要(你|您)|告诉(我|你)|回(我|复)|确认|是否|要不要|可以吗|行不行|粘贴|贴(一|上)|输入|选(择|一个|\d)|provide|paste|enter|your (api|token|key|password)/i;

function parseArgs(argv) {
  const args = { keep: false, timeoutMin: 15 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--keep") args.keep = true;
    else if (a === "--timeout-min") args.timeoutMin = Number(argv[++i]);
  }
  return args;
}

const docker = (args) => execFileSync("docker", args, { encoding: "utf8" }).trim();

const PROMPT = `第一步，先安装 yoi 的 skill：npx skills add AkaraChen/yoi --skill yoi -g
第二步，让 yoi CLI 在这台机器上可用，最后用 yoi --version 证明给我看。

过程中需要我做的事（确认、输密码等）直接问我。`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const outDir = path.join(REPO_ROOT, "trials", `smoke-${ts}`);
  mkdirSync(outDir, { recursive: true });
  const events = createWriteStream(path.join(outDir, "events.jsonl"));
  const transcript = createWriteStream(path.join(outDir, "transcript.md"));
  const say = (line) => console.log(line);
  const tlog = (line) => transcript.write(line + "\n");

  const container = `pack-trial-smoke-${Date.now().toString(36)}`;
  const startedAt = new Date();
  const metrics = {
    image: IMAGE,
    startedAt: startedAt.toISOString(),
    questions: 0,
    turns: 0,
    toolCalls: 0,
    status: "started",
    usedInstallSh: false,
    usedGoInstall: false,
    versionSeenAt: null,
    wallToVersionSec: null,
    notes: [],
  };

  tlog(`# yoi 二进制分发 smoke transcript\n`);
  tlog(`- 开始: ${startedAt.toISOString()}`);
  tlog(`- 镜像: ${IMAGE}`);
  tlog(`- 容器: ${container}\n`);

  let sdk;
  try {
    docker(["run", "-d", "--name", container, "-p", "2468", IMAGE]);
    const addr = docker(["port", container, "2468/tcp"]).split("\n")[0].trim();
    say(`container ${container} up at ${addr}`);

    sdk = await SandboxAgent.connect({
      baseUrl: `http://${addr}`,
      waitForHealth: { timeoutMs: 120_000 },
      fetch: (input, init) => undiciFetch(input, { ...init, dispatcher }),
    });
    say("sandbox-agent healthy");

    const agents = await sdk.listAgents();
    if (!agents.agents?.some((a) => a.id === "codex" || a.name === "codex")) {
      say("installing codex agent...");
      await sdk.installAgent("codex");
    }
    const authJson = readFileSync(path.join(homedir(), ".codex", "auth.json"), "utf8");
    await sdk.runProcess({
      command: "sh",
      args: ["-c", "mkdir -p /home/sandbox/.codex && chmod 700 /home/sandbox/.codex"],
    });
    await sdk.writeFsFile({ path: "/home/sandbox/.codex/auth.json" }, authJson);
    await sdk.runProcess({
      command: "sh",
      args: ["-c", "chmod 600 /home/sandbox/.codex/auth.json"],
    });
    say("codex auth injected");

    const session = await sdk.createSession({
      agent: "codex",
      mode: "full-access",
      model: "gpt-5.4",
      cwd: "/home/sandbox",
    });
    say(`session ${session.id}`);

    let agentBuf = "";
    const unsub = session.onEvent((event) => {
      events.write(JSON.stringify(event) + "\n");
      const raw = JSON.stringify(event);
      if (!metrics.versionSeenAt && VERSION_RE.test(raw)) {
        metrics.versionSeenAt = new Date().toISOString();
        metrics.wallToVersionSec = Math.round((Date.now() - startedAt.getTime()) / 1000);
        say(`>>> v0.1.0 detected at +${metrics.wallToVersionSec}s`);
      }
      if (!metrics.usedInstallSh && /install\.sh/.test(raw)) metrics.usedInstallSh = true;
      if (!metrics.usedGoInstall && /go install/.test(raw)) metrics.usedGoInstall = true;
      const u = event.payload?.params?.update ?? event.payload ?? {};
      if (u.sessionUpdate === "agent_message_chunk" && u.content?.text) {
        agentBuf += u.content.text;
      } else if (u.sessionUpdate === "tool_call") {
        metrics.toolCalls++;
        tlog(`\n> 工具: ${u.title ?? u.toolCallId} (${u.status ?? ""})`);
      }
    });

    const flushAgent = () => {
      const text = agentBuf.trim();
      agentBuf = "";
      if (text) tlog(`\n**Codex**: ${text}\n`);
      return text;
    };

    const withTimeout = (p, ms, label) =>
      Promise.race([
        p,
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error(`${label} timed out after ${ms / 60000}min`)), ms),
        ),
      ]);

    let message = PROMPT;
    const deadline = Date.now() + args.timeoutMin * 60_000;
    let emptyTurns = 0;
    tlog(`\n**人类**: ${message}\n`);
    while (true) {
      if (Date.now() > deadline) {
        metrics.status = "timeout";
        break;
      }
      metrics.turns++;
      say(`turn ${metrics.turns}...`);
      let stopReason = "";
      try {
        const res = await withTimeout(
          session.prompt([{ type: "text", text: message }]),
          TURN_TIMEOUT_MS,
          `turn ${metrics.turns}`,
        );
        stopReason = res?.stopReason ?? "";
      } catch (e) {
        flushAgent();
        metrics.status = "error";
        metrics.notes.push(String(e.message ?? e));
        say(`turn error: ${e.message}`);
        break;
      }
      const text = flushAgent();
      say(`turn ${metrics.turns} done (stopReason=${stopReason}, ${text.length} chars)`);

      if (metrics.versionSeenAt) {
        metrics.status = "success";
        break;
      }
      if (text.length < 5) {
        emptyTurns++;
        if (emptyTurns > 2) {
          metrics.status = "stalled";
          break;
        }
        message = "继续，自己拿主意，别等我。";
        tlog(`\n**人类(自动回复)**: ${message}\n`);
        continue;
      }
      emptyTurns = 0;

      if (QUESTION_RE.test(text) && metrics.questions < MAX_QUESTIONS) {
        metrics.questions++;
        message = AUTO_REPLY;
        tlog(`\n**人类(自动回复)**: ${message}\n`);
        say(`question detected (#${metrics.questions}), replying`);
        continue;
      }
      metrics.status = metrics.questions >= MAX_QUESTIONS ? "max-questions" : "completed";
      break;
    }

    metrics.endedAt = new Date().toISOString();
    metrics.totalWallSec = Math.round((Date.now() - startedAt.getTime()) / 1000);
    unsub();
    await sdk.destroySession(session.id).catch(() => {});
    await sdk.dispose().catch(() => {});
  } finally {
    events.end();
    if (!args.keep) {
      try {
        docker(["rm", "-f", container]);
        say(`container ${container} removed`);
      } catch {}
    } else {
      say(`container ${container} kept`);
    }
  }

  writeFileSync(path.join(outDir, "metrics.json"), JSON.stringify(metrics, null, 2) + "\n");
  transcript.end();
  say(
    `\nstatus=${metrics.status} wallToVersion=${metrics.wallToVersionSec}s questions=${metrics.questions} toolCalls=${metrics.toolCalls} installSh=${metrics.usedInstallSh} goInstall=${metrics.usedGoInstall}`,
  );
  say(`artifacts: ${outDir}`);
}

process.on("unhandledRejection", (e) => {
  console.error("unhandledRejection (ignored):", e?.message ?? e);
});

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
