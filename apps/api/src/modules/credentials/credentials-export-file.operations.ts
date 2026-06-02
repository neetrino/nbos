import { encrypt } from '../../common/utils/crypto';
import type { CredentialsAccessContext } from './credentials-access';
import type { ExportCredentialsInput } from './credential-domain.types';
import { exportCredentialsBundle } from './credentials-secrets.operations';
import type { CredentialsRuntime } from './credentials-runtime';

const EXPORT_FILE_FORMAT = 'nbos-credentials-export-v1';

export async function exportCredentialsEncryptedFile(
  runtime: CredentialsRuntime,
  input: ExportCredentialsInput,
  access: CredentialsAccessContext,
) {
  const bundle = await exportCredentialsBundle(runtime, input, access);
  const plaintext = JSON.stringify(bundle);
  const ciphertext = encrypt(plaintext, runtime.encryptionKey);
  const exportedAt = new Date().toISOString().replace(/[:.]/g, '-');

  return {
    format: EXPORT_FILE_FORMAT,
    filename: `credentials-export-${exportedAt}.nbos-cred.enc.json`,
    mimeType: 'application/json',
    contentBase64: Buffer.from(
      JSON.stringify({ format: EXPORT_FILE_FORMAT, ciphertext }),
      'utf8',
    ).toString('base64'),
    count: bundle.count,
  };
}
