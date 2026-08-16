import http from 'node:http';
import type { BullmqWorkerRegistry } from './bullmq-worker-registry';

export type WorkerHealthDeps = {
  registry: BullmqWorkerRegistry;
  isRedisReady: () => Promise<boolean>;
  isPrismaReady: () => Promise<boolean>;
};

/**
 * Minimal HTTP health server for Coolify — not the public Nest API.
 */
export function startWorkerHealthServer(port: number, deps: WorkerHealthDeps): http.Server {
  const server = http.createServer((req, res) => {
    const url = req.url?.split('?')[0] ?? '';
    void (async () => {
      if (url === '/health' || url === '/api/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', role: 'worker' }));
        return;
      }
      if (url === '/ready' || url === '/api/ready') {
        if (deps.registry.isShuttingDown() || !deps.registry.isStartupComplete()) {
          res.writeHead(503, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ready: false, reason: 'startup_or_shutdown' }));
          return;
        }
        const workers = deps.registry.list();
        if (workers.length === 0) {
          res.writeHead(503, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ready: false, reason: 'no_workers' }));
          return;
        }
        const [redisOk, prismaOk] = await Promise.all([deps.isRedisReady(), deps.isPrismaReady()]);
        if (!redisOk || !prismaOk) {
          res.writeHead(503, { 'content-type': 'application/json' });
          res.end(
            JSON.stringify({
              ready: false,
              redis: redisOk,
              prisma: prismaOk,
              workers,
            }),
          );
          return;
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ready: true, workers }));
        return;
      }
      res.writeHead(404);
      res.end();
    })().catch(() => {
      res.writeHead(500);
      res.end();
    });
  });
  server.listen(port);
  return server;
}
