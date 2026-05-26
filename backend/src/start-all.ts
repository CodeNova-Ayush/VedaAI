/**
 * Production bootstrap: starts the API and the BullMQ worker side-by-side
 * inside a single process tree. This is what Render's free-tier Web Service
 * runs (Background Workers are paid).
 *
 * If either child exits with a non-zero code, the parent exits too so Render
 * restarts the container.
 */
import { spawn } from 'child_process';

const children = [
  spawn(process.execPath, [require.resolve('./index.js')], {
    stdio: 'inherit',
    env: process.env,
  }),
  spawn(process.execPath, [require.resolve('./worker.js')], {
    stdio: 'inherit',
    env: process.env,
  }),
];

let exiting = false;
function shutdown(code: number): void {
  if (exiting) return;
  exiting = true;
  for (const c of children) {
    if (!c.killed) c.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 500).unref();
}

children.forEach((c, i) => {
  c.on('exit', (code, signal) => {
    const label = i === 0 ? 'api' : 'worker';
    console.log(`[start-all] ${label} exited code=${code} signal=${signal}`);
    shutdown(code ?? 1);
  });
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
