import { join, sql, type PrismaClient } from '@nbos/database';
import type { CredentialSecretsPresent } from './credential-domain.types';

interface CredentialPresenceRow {
  id: string;
  password: boolean;
  passphrase: boolean;
  apiKey: boolean;
  envData: boolean;
  secureNotes: boolean;
}

/**
 * Computes secret-presence booleans in PostgreSQL for the given credential ids.
 * Avoids shipping encrypted blobs to the API just to derive `true`/`false` flags.
 */
export async function loadCredentialSecretsPresence(
  prisma: InstanceType<typeof PrismaClient>,
  ids: string[],
): Promise<Map<string, CredentialSecretsPresent>> {
  if (ids.length === 0) return new Map();

  const rows = await prisma.$queryRaw<CredentialPresenceRow[]>(sql`
    SELECT
      id,
      (password IS NOT NULL AND password <> '') AS "password",
      (passphrase IS NOT NULL AND passphrase <> '') AS "passphrase",
      (api_key IS NOT NULL AND api_key <> '') AS "apiKey",
      (env_data IS NOT NULL AND env_data <> '') AS "envData",
      (secure_notes IS NOT NULL AND secure_notes <> '') AS "secureNotes"
    FROM credentials
    WHERE id IN (${join(ids.map((id) => sql`${id}`))})
  `);

  return new Map(
    rows.map((row) => [
      row.id,
      {
        password: row.password,
        passphrase: row.passphrase,
        apiKey: row.apiKey,
        envData: row.envData,
        secureNotes: row.secureNotes,
      },
    ]),
  );
}
