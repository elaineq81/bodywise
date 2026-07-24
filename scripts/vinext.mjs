import { spawn } from 'node:child_process';

const command = process.argv[2] || 'build';
const allowed = new Set(['dev', 'build', 'start']);
if (!allowed.has(command)) {
  console.error('Usage: node scripts/vinext.mjs <dev|build|start>');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const runner = isWindows ? 'cmd.exe' : 'npx';
const args = isWindows ? ['/d', '/s', '/c', 'npx vinext ' + command] : ['vinext', command];
const child = spawn(runner, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH || '.wrangler/wrangler.log'
  }
});

child.on('exit', code => process.exit(code ?? 1));
child.on('error', error => {
  console.error(error);
  process.exit(1);
});
