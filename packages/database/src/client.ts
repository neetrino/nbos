import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { buildRuntimeDatabaseUrl } from './runtime-database-url';
import { resolveDbPoolRuntimeConfig, resolvePoolMaxForRole, type DbPoolRole } from './db-pool-env';
import { assertConnectionBudgetForStartup } from './connection-budget';

let activeClientCount = 0;

export function getActivePrismaClientCount(): number {
  return activeClientCount;
}

export type CreatePrismaClientOptions = {
  databaseUrl?: string;
  role?: DbPoolRole;
  env?: NodeJS.ProcessEnv;
  /** Skip budget assert (CLI scripts / tests). */
  skipBudgetAssert?: boolean;
  /** When true, do not apply role-specific URL rewriting (use URL as-is). */
  skipUrlRewrite?: boolean;
};

/**
 * Single factory for runtime Prisma clients (API / Worker / Scheduler / seeds).
 * Uses `@prisma/adapter-pg` + `pg.Pool` with role-specific `max`.
 */
export function createPrismaClient(options: CreatePrismaClientOptions = {}): PrismaClient {
  const env = options.env ?? process.env;
  const role: DbPoolRole = options.role ?? ((env.PROCESS_ROLE?.trim() as DbPoolRole) || 'api');
  const baseUrl = options.databaseUrl ?? env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (!options.skipBudgetAssert) {
    assertConnectionBudgetForStartup(env);
  }

  const cfg = resolveDbPoolRuntimeConfig(env);
  const poolMax = resolvePoolMaxForRole(role, env);

  const { url, safeSummary } = options.skipUrlRewrite
    ? { url: baseUrl, safeSummary: 'url=as-is' }
    : buildRuntimeDatabaseUrl({
        role,
        baseUrl,
        poolMax,
        poolTimeoutSec: cfg.poolTimeoutSec,
        connectTimeoutSec: cfg.connectTimeoutSec,
      });

  const pool = new Pool({
    connectionString: url,
    max: poolMax,
    connectionTimeoutMillis: cfg.connectTimeoutSec * 1000,
    idleTimeoutMillis: Math.max(10_000, cfg.poolTimeoutSec * 1000),
    allowExitOnIdle: true,
  });

  pool.on('connect', (client) => {
    void client.query(`SET statement_timeout TO ${cfg.statementTimeoutMs}`).catch(() => undefined);
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  activeClientCount += 1;
  const originalDisconnect = client.$disconnect.bind(client);
  client.$disconnect = async () => {
    await originalDisconnect();
    await pool.end().catch(() => undefined);
    activeClientCount = Math.max(0, activeClientCount - 1);
  };

  // Attach non-enumerable diagnostics for startup logs (no secrets).
  Object.defineProperty(client, '__nbosDbDiagnostics', {
    value: {
      role,
      poolMax,
      safeSummary,
      clientInstances: activeClientCount,
    },
    enumerable: false,
  });

  return client;
}

export type PrismaClientDiagnostics = {
  role: DbPoolRole;
  poolMax: number;
  safeSummary: string;
  clientInstances: number;
};

export function readPrismaClientDiagnostics(client: PrismaClient): PrismaClientDiagnostics | null {
  const diag = (client as unknown as { __nbosDbDiagnostics?: PrismaClientDiagnostics })
    .__nbosDbDiagnostics;
  return diag ?? null;
}
