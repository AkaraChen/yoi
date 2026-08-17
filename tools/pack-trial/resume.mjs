#!/usr/bin/env node
// Rescue a trial whose driver lost its HTTP stream: reconnect to the running
// container, resume the codex session, and continue the human loop.
//
//   node resume.mjs <slug> <addr> <sessionId> <outDir> <questionsSoFar> [timeoutMin]

import { SandboxAgent } from "sandbox-agent";
import { appendFileSync, createWriteStream, writeFileSync } from "node:fs";
import path from "node:path";

const MAX_QUESTIONS = 8;
const TURN_TIMEOUT_MS = 15 * 60_000;
const QUIET_MS = 90_000; // no events for this long => treat turn as ended

const QUESTION_RE =
  /[?？]|吗[。，!！]?$|请(你|您|问)|需要(你|您)|告诉(我|你)|确认|是否|要不要|可以吗|行不行|粘贴|贴(一|上)|输入|provide|paste|enter|your (api|token|key|password)/i;

const [slug, addr, sessionId, outDir, questionsSoFar, timeoutMin] = process.argv.slice(2);
if (!slug || !addr || !sessionId || !outDir) {
  console.error("usage: node resume.mjs <slug> <addr> <sessionId> <outDir> <questionsSoFar> [timeoutMin]");
  process.exit(2);
}

const events = createWriteStream(path.join(outDir, "events.jsonl"), { flags: "a" });
const transcript = createWriteStream(path.join(outDir, "transcript.md"), { flags: "a" });
const tlog = (line) => transcript.write(line + "\n");
const metricsPath = path.join(outDir, "metrics.json");

const metrics = {
  slug,
  resumed: true,
  questions: Number(questionsSoFar || 0),
  turns: 0,
  toolCalls: 0,
  status: "unknown",
  notes: [`resumed via resume.mjs at ${new Date().toISOString()}`],
};

process.on("unhandledRejection", (e) => {
  console.error("unhandledRejection (ignored):", e?.message ?? e);
});

const sdk = await SandboxAgent.connect({
  baseUrl: `http://${addr}`,
  waitForHealth: { timeoutMs: 60_000 },
});
console.log("reconnected to", addr);

const session = await sdk.resumeSession(sessionId);
console.log("resumed session", session.id);

let agentBuf = "";
let lastEventAt = Date.now();
const unsub = session.onEvent((event) => {
  lastEventAt = Date.now();
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

// Wait for the in-flight turn to go quiet, then reconstruct what it said.
// If the stream broke before we re-attached, fall back to persisted events.
async function waitForQuietTurn() {
  const cap = Date.now() + TURN_TIMEOUT_MS;
  // give the stream a moment to prove it's alive
  await new Promise((r) => setTimeout(r, 10_000));
  while (Date.now() < cap) {
    if (Date.now() - lastEventAt > QUIET_MS) return "quiet";
    await new Promise((r) => setTimeout(r, 5_000));
  }
  return "timeout";
}

async function lastAgentTextFromHistory() {
  const page = await sdk.getEvents({ sessionId, limit: 200 });
  let text = "";
  for (const item of page.items ?? []) {
    const u = item.payload?.params?.update ?? item.payload ?? {};
    if (u.sessionUpdate === "agent_message_chunk" && u.content?.text) text += u.content.text;
    // a new user message means the previous agent message ended
    if (u.sessionUpdate === "user_message_chunk") text = "";
  }
  return text;
}

const withTimeout = (p, ms, label) =>
  Promise.race([
    p,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error(`${label} timed out after ${ms / 60000}min`)), ms),
    ),
  ]);

const deadline = Date.now() + Number(timeoutMin || 40) * 60_000;

try {
  // 1. let the in-flight turn finish (or go quiet)
  console.log("waiting for in-flight turn to go quiet...");
  const how = await waitForQuietTurn();
  let text = flushAgent();
  if (!text) text = (await lastAgentTextFromHistory()).trim();
  if (text) tlog(`\n**Codex(重建)**: ${text}\n`);
  console.log(`in-flight turn ${how}, reconstructed ${text.length} chars`);
  metrics.turns++;

  // 2. continue the standard human loop
  let message = null;
  while (true) {
    if (Date.now() > deadline) {
      metrics.status = "timeout";
      break;
    }
    if (QUESTION_RE.test(text) && metrics.questions < MAX_QUESTIONS) {
      metrics.questions++;
      message = "是，继续。";
      tlog(`\n**人类(自动回复)**: ${message}\n`);
      console.log(`question detected (#${metrics.questions}), replying 是，继续。`);
    } else if (text) {
      metrics.status = metrics.questions >= MAX_QUESTIONS ? "max-questions" : "completed";
      break;
    } else {
      // nothing reconstructed; nudge the agent
      message = "继续。";
      tlog(`\n**人类(自动回复)**: ${message}\n`);
    }

    metrics.turns++;
    agentBuf = "";
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
      console.error(`turn error: ${e.message}`);
      break;
    }
    text = flushAgent();
    console.log(`turn ${metrics.turns} done (stopReason=${stopReason}, ${text.length} chars)`);
  }
} finally {
  metrics.endedAt = new Date().toISOString();
  unsub();
  await sdk.destroySession(session.id).catch(() => {});
  await sdk.dispose().catch(() => {});
  events.end();
  transcript.end();
}

writeFileSync(metricsPath, JSON.stringify(metrics, null, 2) + "\n");
appendFileSync(
  path.join(outDir, "report.md"),
  `\n> 注：本试验驱动断线后经 resume.mjs 接管，metrics 只含接管后的计数。\n`,
);
console.log(`\nstatus=${metrics.status} questions=${metrics.questions} turns=${metrics.turns}`);
console.log(`artifacts: ${outDir}`);
console.log(`container left running for manual cleanup: docker rm -f pack-trial-${slug}-*`);
