import { startServer } from '/home/claude/aion2-companion/scripts/serve.mjs';
import { spawn } from 'node:child_process';
const { server, url } = await startServer({ baselines: true });
const code = await new Promise(res => spawn(process.execPath, process.argv.slice(2), { stdio: 'inherit', env: { ...process.env, AION_BASE: url } }).on('close', res));
server.close(); process.exit(code);
