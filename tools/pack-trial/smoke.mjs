// Smoke test: validate SDK calls against a throwaway container before real trials.
import { SandboxAgent } from "sandbox-agent";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const IMAGE = "rivetdev/sandbox-agent:0.4.2-full";
const docker = (args) => execFileSync("docker", args, { encoding: "utf8" }).trim();

const name = `pack-trial-smoke-${Date.now().toString(36)}`;
docker(["run", "-d", "--name", name, "-p", "2468", IMAGE]);
const addr = docker(["port", name, "2468/tcp"]).split("\n")[0].trim();
console.log("container at", addr);

try {
  const sdk = await SandboxAgent.connect({
    baseUrl: `http://${addr}`,
    waitForHealth: { timeoutMs: 120_000 },
  });
  console.log("health ok");

  const agents = await sdk.listAgents();
  console.log("listAgents:", JSON.stringify(agents).slice(0, 600));

  console.log("installAgent codex...");
  await sdk.installAgent("codex");
  console.log("installAgent done");

  const authJson = readFileSync(path.join(homedir(), ".codex", "auth.json"), "utf8");
  const mk = await sdk.runProcess({
    command: "sh",
    args: ["-c", "mkdir -p /home/sandbox/.codex && chmod 700 /home/sandbox/.codex"],
  });
  console.log("mkdir exit", mk.exitCode);
  const w = await sdk.writeFsFile({ path: "/home/sandbox/.codex/auth.json" }, authJson);
  console.log("writeFsFile:", JSON.stringify(w));
  await sdk.runProcess({
    command: "sh",
    args: ["-c", "chmod 600 /home/sandbox/.codex/auth.json && ls -la /home/sandbox/.codex"],
  }).then((r) => console.log(r.stdout.trim()));

  const session = await sdk.createSession({
    agent: "codex",
    mode: "full-access",
    model: "gpt-5.4",
    cwd: "/home/sandbox",
  });
  console.log("session:", session.id);

  let buf = "";
  const unsub = session.onEvent((e) => {
    const u = e.payload?.params?.update ?? e.payload ?? {};
    if (u.sessionUpdate === "agent_message_chunk" && u.content?.text) buf += u.content.text;
    else if (u.sessionUpdate === "tool_call") console.log("tool:", u.title);
  });

  const res = await session.prompt([
    { type: "text", text: "用一句话介绍你自己，然后告诉我当前目录下有什么文件。" },
  ]);
  console.log("stopReason:", res?.stopReason);
  console.log("agent said:", buf.trim().slice(0, 500));

  await sdk.destroySession(session.id).catch(() => {});
  unsub();
  await sdk.dispose().catch(() => {});
} finally {
  docker(["rm", "-f", name]);
  console.log("container removed");
}
