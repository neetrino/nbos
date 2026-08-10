/**
 * CLI: reconcile missing PROJECT_GENERAL conversations.
 *
 *   pnpm messenger:project-general:dry
 *   pnpm messenger:project-general:apply
 *
 * Safe / idempotent. Does not modify legacy tables.
 */
import fs from 'fs';
import path from 'path';
import { createPrismaClient } from '@nbos/database';
import { reconcileProjectGeneralConversations } from '../src/modules/messenger/migration/messenger-project-general-reconcile.ops';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseMode(argv: string[]): 'dry-run' | 'apply' {
  return argv.includes('--apply') ? 'apply' : 'dry-run';
}

function safeDbIdentity(url: string | undefined): { host: string; database: string } {
  if (!url) return { host: 'unknown', database: 'unknown' };
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'unknown',
      database: parsed.pathname.replace(/^\//, '') || 'unknown',
    };
  } catch {
    return { host: 'unparsed', database: 'unparsed' };
  }
}

async function main(): Promise<void> {
  loadEnvFile(path.resolve(__dirname, '../../../.env.local'));
  loadEnvFile(path.resolve(__dirname, '../../../.env'));
  process.env.PROCESS_ROLE = process.env.PROCESS_ROLE ?? 'api';

  const mode = parseMode(process.argv.slice(2));
  const identity = safeDbIdentity(process.env.DATABASE_URL);
  console.log(
    JSON.stringify(
      {
        mode,
        databaseHost: identity.host,
        databaseName: identity.database,
        legacyWriteMode: process.env.MESSENGER_LEGACY_WRITE_MODE ?? 'enabled',
      },
      null,
      2,
    ),
  );

  const prisma = createPrismaClient({ skipBudgetAssert: true });
  try {
    const result = await reconcileProjectGeneralConversations(prisma, { mode });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.counts.blocked > 0 ? 2 : 0;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
