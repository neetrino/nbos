import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';

/**
 * Agent credential secrets reuse the platform password baseline (argon2id).
 * No second crypto stack is introduced: reversible provider secrets keep using
 * the AES-256-GCM helpers in `common/utils/crypto.ts`, while bearer credentials
 * only ever need a one-way verifier.
 */
export async function hashAgentSecret(secret: string): Promise<string> {
  return argon2.hash(secret, { type: argon2.argon2id });
}

/** Never throws on malformed hashes; a failed verification is simply `false`. */
export async function verifyAgentSecret(hash: string, secret: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, secret);
  } catch {
    return false;
  }
}

const DECOY_SECRET_BYTES = 32;
/** Generated per process, so no presented secret can ever verify against it. */
const DECOY_SECRET = randomBytes(DECOY_SECRET_BYTES).toString('hex');
let decoyHash: Promise<string> | null = null;

function decoyVerifier(): Promise<string> {
  decoyHash ??= hashAgentSecret(DECOY_SECRET);
  return decoyHash;
}

/**
 * Builds the decoy verifier ahead of the first request so an unknown key id does
 * not pay a one-off hashing cost that a caller could measure.
 */
export async function primeAgentSecretVerifier(): Promise<void> {
  await decoyVerifier();
}

/**
 * Runs a real verification against a decoy verifier and always fails.
 *
 * An unknown key id must cost the same as a wrong secret, and it must cost it on
 * the same code path: hashing instead of verifying has a different profile and
 * would leave the timing signal it was meant to remove.
 */
export async function verifyAgainstDecoySecret(secret: string): Promise<boolean> {
  await verifyAgentSecret(await decoyVerifier(), secret);
  return false;
}
