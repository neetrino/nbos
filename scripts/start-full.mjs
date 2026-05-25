import net from 'node:net';
import process from 'node:process';
import { spawn } from 'node:child_process';

const DEFAULT_WEB_PORT = 3000;
const DEFAULT_API_PORT = 4000;

function parsePort(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

function runPnpm(args, envOverrides = {}) {
  return spawn('pnpm', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}

const webPort = parsePort(process.env.WEB_PORT, DEFAULT_WEB_PORT);
const apiPort = parsePort(process.env.API_PORT, DEFAULT_API_PORT);

const checks = await Promise.all([
  checkPortAvailability(webPort),
  checkPortAvailability(apiPort),
]);

const [isWebPortFree, isApiPortFree] = checks;
if (!isWebPortFree || !isApiPortFree) {
  const busy = [
    !isWebPortFree ? `WEB_PORT=${webPort}` : null,
    !isApiPortFree ? `API_PORT=${apiPort}` : null,
  ].filter(Boolean);

  console.error(
    `[start:full] Required port(s) are busy: ${busy.join(', ')}.\n` +
      'Stop existing processes or run with custom ports, for example:\n' +
      `WEB_PORT=3100 API_PORT=4100 pnpm start:full`,
  );
  process.exit(1);
}

const apiProcess = runPnpm(['--filter', '@nbos/api', 'start'], {
  PORT: String(apiPort),
});
const webProcess = runPnpm(['--filter', '@nbos/web', 'start'], {
  PORT: String(webPort),
});

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  apiProcess.kill('SIGTERM');
  webProcess.kill('SIGTERM');
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

apiProcess.on('exit', (code) => {
  if (shuttingDown) return;
  if (code === 0) return shutdown(0);
  console.error(`[start:full] API exited with code ${code ?? 'unknown'}.`);
  shutdown(1);
});

webProcess.on('exit', (code) => {
  if (shuttingDown) return;
  if (code === 0) return shutdown(0);
  console.error(`[start:full] WEB exited with code ${code ?? 'unknown'}.`);
  shutdown(1);
});
