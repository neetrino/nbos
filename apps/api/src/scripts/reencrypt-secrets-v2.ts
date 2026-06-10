/**
 * One-off CLI: migrate legacy AES blobs to v2 scrypt format and strip deprecated
 * Gmail accessToken/expiryDate from MailProviderSecret JSON.
 *
 * Usage (from repo root):
 *   CREDENTIALS_ENCRYPTION_KEY=… DATABASE_URL=… pnpm --filter @nbos/api reencrypt-secrets-v2
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@nbos/database';
import { reencryptSecretsToV2 } from '../common/utils/reencrypt-secrets-v2.ops';

async function main(): Promise<void> {
  const encryptionKey = process.env.CREDENTIALS_ENCRYPTION_KEY?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!encryptionKey) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY is required');
  }
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  try {
    const summary = await reencryptSecretsToV2(prisma, encryptionKey);
    console.log('Re-encrypt v2 migration complete:');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`reencrypt-secrets-v2 failed: ${message}`);
  process.exit(1);
});
