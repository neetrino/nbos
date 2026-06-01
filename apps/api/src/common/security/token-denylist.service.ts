import { Injectable } from '@nestjs/common';

/** Sweep expired entries at most once per this interval to bound the map size. */
const SWEEP_INTERVAL_MS = 60_000;

/** Fallback TTL when a token carries no `exp` claim (should not happen for our tokens). */
const FALLBACK_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

/**
 * In-memory revocation list keyed by JWT `jti`.
 *
 * Used to invalidate access tokens on logout before their natural expiry.
 * Entries self-expire at the token's own `exp`, so the map never grows
 * beyond the set of tokens revoked within their remaining lifetime.
 *
 * Limitation: state is per-process. This is sufficient for a single API
 * instance. For multi-instance / restart-durable revocation, back this with
 * Redis (`SETEX denylist:<jti> <ttl> 1`) — kept as a documented follow-up.
 */
@Injectable()
export class TokenDenylistService {
  private readonly revoked = new Map<string, number>();
  private lastSweep = 0;

  /** Revoke a token by its `jti` until the given expiry (epoch ms). */
  revokeUntil(jti: string, expiresAtMs: number): void {
    const now = Date.now();
    const expiry = Number.isFinite(expiresAtMs) ? expiresAtMs : now + FALLBACK_TTL_MS;
    if (expiry <= now) {
      return;
    }
    this.revoked.set(jti, expiry);
    this.sweepIfDue(now);
  }

  /** Returns true when the token has been revoked and is still within its lifetime. */
  isRevoked(jti: string | undefined): boolean {
    if (!jti) {
      return false;
    }
    const expiresAt = this.revoked.get(jti);
    if (expiresAt === undefined) {
      return false;
    }
    if (expiresAt <= Date.now()) {
      this.revoked.delete(jti);
      return false;
    }
    return true;
  }

  private sweepIfDue(now: number): void {
    if (now - this.lastSweep < SWEEP_INTERVAL_MS) {
      return;
    }
    this.lastSweep = now;
    for (const [jti, expiresAt] of this.revoked) {
      if (expiresAt <= now) {
        this.revoked.delete(jti);
      }
    }
  }
}
