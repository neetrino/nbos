import type { PrismaClient } from '@nbos/database';
import { SENSITIVE_FIELDS } from '../../modules/credentials/credential-domain.types';
import { decrypt, encrypt } from './crypto';
import { isV2Ciphertext, reencryptCiphertextToV2 } from './crypto-reencrypt.ops';
import {
  mailProviderSecretNeedsNormalization,
  normalizeMailProviderSecret,
} from '../../modules/mail/providers/mail-provider-secret.normalize';
import type { MailProviderSecret } from '../../modules/mail/providers/mail-provider-secret.store';

export interface ReencryptSecretsV2Summary {
  mailProviderSecrets: { scanned: number; migrated: number };
  credentials: { scanned: number; fieldsMigrated: number };
  credentialSecretVersions: { scanned: number; migrated: number };
}

async function migrateMailProviderSecrets(
  prisma: InstanceType<typeof PrismaClient>,
  encryptionKey: string,
): Promise<{ scanned: number; migrated: number }> {
  const rows = await prisma.mailProviderSecret.findMany({
    select: { id: true, mailAccountId: true, encryptedSecret: true },
  });
  let migrated = 0;
  for (const row of rows) {
    const crypto = reencryptCiphertextToV2(row.encryptedSecret, encryptionKey);
    const parsed = JSON.parse(decrypt(crypto.value, encryptionKey)) as MailProviderSecret;
    const needsJsonNormalize = mailProviderSecretNeedsNormalization(parsed);
    const plaintext = needsJsonNormalize
      ? JSON.stringify(normalizeMailProviderSecret(parsed))
      : null;
    const nextCiphertext = plaintext ? encrypt(plaintext, encryptionKey) : crypto.value;
    if (crypto.migrated || needsJsonNormalize) {
      await prisma.mailProviderSecret.update({
        where: { id: row.id },
        data: { encryptedSecret: nextCiphertext },
      });
      migrated += 1;
    }
  }
  return { scanned: rows.length, migrated };
}

async function migrateCredentialFields(
  prisma: InstanceType<typeof PrismaClient>,
  encryptionKey: string,
): Promise<{ scanned: number; fieldsMigrated: number }> {
  const rows = await prisma.credential.findMany();
  let fieldsMigrated = 0;
  for (const row of rows) {
    const updates: Record<string, string> = {};
    for (const field of SENSITIVE_FIELDS) {
      const stored = row[field];
      if (typeof stored !== 'string' || !stored.includes(':') || isV2Ciphertext(stored)) {
        continue;
      }
      const { value, migrated } = reencryptCiphertextToV2(stored, encryptionKey);
      if (migrated) {
        updates[field] = value;
        fieldsMigrated += 1;
      }
    }
    if (Object.keys(updates).length > 0) {
      await prisma.credential.update({ where: { id: row.id }, data: updates });
    }
  }
  return { scanned: rows.length, fieldsMigrated };
}

async function migrateCredentialSecretVersions(
  prisma: InstanceType<typeof PrismaClient>,
  encryptionKey: string,
): Promise<{ scanned: number; migrated: number }> {
  const rows = await prisma.credentialSecretVersion.findMany({
    select: { id: true, ciphertext: true },
  });
  let migrated = 0;
  for (const row of rows) {
    const { value, migrated: didMigrate } = reencryptCiphertextToV2(row.ciphertext, encryptionKey);
    if (!didMigrate) {
      continue;
    }
    await prisma.credentialSecretVersion.update({
      where: { id: row.id },
      data: { ciphertext: value },
    });
    migrated += 1;
  }
  return { scanned: rows.length, migrated };
}

/** One-off migration: legacy ciphertext and deprecated Gmail blob fields → v2/minimal JSON. */
export async function reencryptSecretsToV2(
  prisma: InstanceType<typeof PrismaClient>,
  encryptionKey: string,
): Promise<ReencryptSecretsV2Summary> {
  const mailProviderSecrets = await migrateMailProviderSecrets(prisma, encryptionKey);
  const credentials = await migrateCredentialFields(prisma, encryptionKey);
  const credentialSecretVersions = await migrateCredentialSecretVersions(prisma, encryptionKey);
  return { mailProviderSecrets, credentials, credentialSecretVersions };
}
