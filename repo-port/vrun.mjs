import { startServer } from '/home/claude/aion2-companion/scripts/serve.mjs';
import { spawn } from 'node:child_process';
const { server, url } = await startServer({ baselines: true });
const code = await new Promise(res => spawn(process.execPath, [process.argv[2], process.argv[3]], { stdio: 'inherit', env: { ...process.env, AION_BASE: url, NODE_PATH: '/home/claude/aion2-companion/node_modules:' + process.env.NODE_PATH } }).on('close', res));
server.close(); process.exit(code);
