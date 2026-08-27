#!/usr/bin/env node
// pack-trial driver: run one pack install trial.
//
//   node trial.mjs <slug> [--docker] [--timeout-min N] [--keep]
//
// Flow: start sandbox-agent container -> install codex -> inject host codex
// auth -> create full-access session -> play the human: send the install
// request, answer "是，继续。" to questions -> write transcript + report
// skeleton under trials/<slug>-<ts>/.
//
// --docker  : mount the host docker socket and install the docker CLI +
//             compose plugin inside the container (lobehub self-host trial).
// --keep    : keep the container after the run (for debugging).

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
const MAX_QUESTIONS = 8;
const TURN_TIMEOUT_MS = 30 * 60_000;

const NAMES = { hermes: "Hermes", openclaw: "OpenClaw", lobehub: "LobeHub" };

// Universal human reply: approves gates, and tells the agent to pick the
// recommended/default option itself when an installer presents choices.
const AUTO_REPLY = "是，继续。如果遇到选项，按推荐或默认的选，不用等我。";

// Heuristic: does the agent's last message wait on the human?
const QUESTION_RE =
  /[?？]|吗[。，!！]?$|请(你|您|问)|需要(你|您)|告诉(我|你)|回(我|复)|确认|是否|要不要|可以吗|行不行|粘贴|贴(一|上)|输入|选(择|一个|\d)|provide|paste|enter|your (api|token|key|password)/i;

function parseArgs(argv) {
  const args = { slug: null, docker: false, keep: false, timeoutMin: 60, packSource: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--docker") args.docker = true;
    else if (a === "--keep") args.keep = true;
    else if (a === "--timeout-min") args.timeoutMin = Number(argv[++i]);
    else if (a === "--pack-source") args.packSource = argv[++i];
    else if (!a.startsWith("-")) args.slug = a;
  }
  if (!args.slug) {
    console.error("usage: node trial.mjs <slug> [--docker] [--timeout-min N] [--keep]");
    process.exit(2);
  }
  return args;
}

function docker(args, opts = {}) {
  return execFileSync("docker", args, { encoding: "utf8", ...opts }).trim();
}

function initialPrompt(slug, packSource) {
  const name = NAMES[slug] ?? slug;
  const sourceNote = packSource
    ? `\n注意：本机的 pack 源已镜像到 ${packSource}。yoi skill 的 pack 配方是纯 HTTP，开始前先 \`export YOI_PACKS=${packSource}\`（skill 里的配方会读这个环境变量）。这是网络安排，照用即可，别的都按 pack 说明来。`
    : "";
  return `我想在这台机器上把 ${name} 跑起来。

第一步，先安装 yoi 的 skill：npx skills add AkaraChen/yoi --skill yoi -g
第二步，用 yoi 安装 ${slug} 这个 pack，按里面的说明完成安装，并按它的「可用标准」验证。${sourceNote}

过程中需要我做的事（确认、贴密钥、输密码等）直接问我。`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { slug } = args;
  const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const outDir = path.join(REPO_ROOT, "trials", `${slug}-${ts}`);
  mkdirSync(outDir, { recursive: true });
  const eventsPath = path.join(outDir, "events.jsonl");
  const transcriptPath = path.join(outDir, "transcript.md");
  const events = createWriteStream(eventsPath);
  const transcript = createWriteStream(transcriptPath);
  const say = (line) => console.log(line);
  const tlog = (line) => transcript.write(line + "\n");

  const container = `pack-trial-${slug}-${Date.now().toString(36)}`;
  const startedAt = new Date();
  const metrics = {
    slug,
    image: IMAGE,
    startedAt: startedAt.toISOString(),
    questions: 0,
    turns: 0,
    toolCalls: 0,
    status: "started",
    notes: [],
  };

  tlog(`# ${slug} 试验 transcript\n`);
  tlog(`- 开始: ${startedAt.toISOString()}`);
  tlog(`- 镜像: ${IMAGE}`);
  tlog(`- 容器: ${container}\n`);

  let sdk;
  try {
    // 1. start container
    const runArgs = ["run", "-d", "--name", container, "-p", "2468"];
    if (args.docker) {
      // host socket is root:root 0660; supplementary group 0 lets the
      // non-root sandbox user reach it (no --user root, keeps trial fidelity)
      runArgs.push("--group-add", "0", "-v", "/var/run/docker.sock:/var/run/docker.sock");
    }
    runArgs.push(IMAGE);
    docker(runArgs);
    const portLine = docker(["port", container, "2468/tcp"]);
    const addr = portLine.split("\n")[0].trim();
    say(`container ${container} up at ${addr}`);

    sdk = await SandboxAgent.connect({
      baseUrl: `http://${addr}`,
      waitForHealth: { timeoutMs: 120_000 },
      // prompt POSTs stay open for a whole turn; disable undici's default
      // 5min headers timeout or long turns kill the stream
      fetch: (input, init) => undiciFetch(input, { ...init, dispatcher }),
    });
    say("sandbox-agent healthy");

    const sh = async (cmd, timeoutMs = 120_000) => {
      const r = await sdk.runProcess({
        command: "sh",
        args: ["-c", cmd],
        timeoutMs,
        maxOutputBytes: 1_048_576,
      });
      if (r.exitCode !== 0) {
        throw new Error(`sh failed (${r.exitCode}): ${cmd}\n${r.stderr || r.stdout}`);
      }
      return r.stdout;
    };

    // 2. codex agent
    const agents = await sdk.listAgents();
    const codexInfo = JSON.stringify(agents).slice(0, 400);
    say(`agents: ${codexInfo}`);
    const installed = agents.agents?.some(
      (a) => a.id === "codex" || a.name === "codex",
    );
    if (!installed) {
      say("installing codex agent...");
      await sdk.installAgent("codex");
      say("codex installed");
    }

    // 3. inject host codex auth (ChatGPT tokens)
    const authJson = readFileSync(path.join(homedir(), ".codex", "auth.json"), "utf8");
    await sh("mkdir -p /home/sandbox/.codex && chmod 700 /home/sandbox/.codex");
    await sdk.writeFsFile({ path: "/home/sandbox/.codex/auth.json" }, authJson);
    await sh("chmod 600 /home/sandbox/.codex/auth.json");
    say("codex auth injected");

    // 4. lobehub: docker CLI + compose plugin against the mounted host socket
    if (args.docker) {
      const arch = (await sh("uname -m")).trim();
      say(`installing docker CLI (arch ${arch})...`);
      await sh("mkdir -p ~/.local/bin ~/.docker/cli-plugins");
      await sh(
        `curl -fsSL --http1.1 --retry 4 --retry-all-errors --connect-timeout 15 https://download.docker.com/linux/static/stable/${arch}/docker-27.5.1.tgz -o /tmp/docker.tgz && tar xzf /tmp/docker.tgz -C /tmp && cp /tmp/docker/docker ~/.local/bin/docker && chmod +x ~/.local/bin/docker`,
        300_000,
      );
      await sh(
        `curl -fsSL --http1.1 --retry 4 --retry-all-errors --connect-timeout 15 https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-${arch} -o ~/.docker/cli-plugins/docker-compose && chmod +x ~/.docker/cli-plugins/docker-compose`,
        300_000,
      );
      await sh(
        `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.profile`,
      );
      const v = await sh(`bash -lc 'docker --version && docker compose version'`);
      say(v.trim());
      const info = await sh(`bash -lc 'docker info --format "{{.ServerVersion}}"'`).catch(
        (e) => `DOCKER SOCKET UNUSABLE: ${e.message}`,
      );
      say(`docker server: ${info.trim()}`);
      metrics.notes.push(`docker server: ${info.trim()}`);
    }

    // 5. session
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

    // 6. play the human
    let message = initialPrompt(slug, args.packSource);
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

      // empty turn: the agent ended without saying anything (seen when it
      // relayed an interactive prompt and disliked the generic reply).
      if (text.length < 5) {
        emptyTurns++;
        if (emptyTurns > 2) {
          metrics.status = "stalled";
          break;
        }
        message = "继续，自己拿主意，别等我。";
        tlog(`\n**人类(自动回复)**: ${message}\n`);
        say(`empty turn (#${emptyTurns}), nudging`);
        continue;
      }
      emptyTurns = 0;

      if (QUESTION_RE.test(text) && metrics.questions < MAX_QUESTIONS) {
        metrics.questions++;
        message = AUTO_REPLY;
        tlog(`\n**人类(自动回复)**: ${message}\n`);
        say(`question detected (#${metrics.questions}), replying ${message}`);
        continue;
      }
      metrics.status = metrics.questions >= MAX_QUESTIONS ? "max-questions" : "completed";
      break;
    }

    metrics.endedAt = new Date().toISOString();
    metrics.durationMin = ((new Date() - startedAt) / 60000).toFixed(1);
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

  writeFileSync(
    path.join(outDir, "metrics.json"),
    JSON.stringify(metrics, null, 2) + "\n",
  );

  const report = `# ${slug} 试验报告

- 状态: ${metrics.status}
- 时长: ${metrics.durationMin ?? "?"} 分钟
- 轮次: ${metrics.turns}，向人提问次数: ${metrics.questions}，工具调用: ${metrics.toolCalls}
- transcript: ./transcript.md，原始事件: ./events.jsonl

## 流程顺畅度

（人工填写：卡在哪一步、有没有走回头路）

## 问题负担

（人工填写：问了什么、是否必要、频率是否烦人）

## 不适感

（人工填写：有没有让人不放心/不舒服的行为）

## 结论

（人工填写）
`;
  writeFileSync(path.join(outDir, "report.md"), report);
  transcript.end();
  say(`\nstatus=${metrics.status} questions=${metrics.questions} turns=${metrics.turns}`);
  say(`artifacts: ${outDir}`);
}

process.on("unhandledRejection", (e) => {
  console.error("unhandledRejection (ignored):", e?.message ?? e);
});

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
