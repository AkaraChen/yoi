import { SandboxAgent } from "sandbox-agent";
const [addr] = process.argv.slice(2);
const sdk = await SandboxAgent["connect"]({ baseUrl: `http://${addr}`, waitForHealth: { timeoutMs: 30000 } });
const s = await sdk.listSessions({ limit: 10 });
console.log(JSON.stringify(s, null, 1).slice(0, 3000));
await sdk.dispose().catch(() => {});
process.exit(0);
