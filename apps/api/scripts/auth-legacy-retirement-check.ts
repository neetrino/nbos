#!/usr/bin/env tsx
/**
 * Readiness helper for disabling legacy denylist after V2 rollout.
 * Does not mutate flags — prints READY / NOT_READY.
 *
 * Usage: pnpm auth:legacy-retirement-check
 */
import { PrismaClient } from '@nbos/database';

function parseDurationToMs(raw: string | undefined): number {
  const value = (raw ?? '7d').trim();
  const match = /^(\d+)([smhd])$/i.exec(value);
  if (!match) {
    // jwt library also accepts bare seconds; treat as days if not matched → 7d
    const asNum = Number(value);
    if (Number.isFinite(asNum) && asNum > 0) return asNum * 1000;
    return 7 * 86_400_000;
  }
  const n = Number(match[1]);
  const unit = match[2]!.toLowerCase();
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

async function main(): Promise<void> {
  const disabledAtRaw = process.env.AUTH_LEGACY_ISSUANCE_DISABLED_AT?.trim();
  const maxLegacyTtlMs = parseDurationToMs(process.env.JWT_EXPIRES_IN);
  const disabledAt = disabledAtRaw ? Date.parse(disabledAtRaw) : NaN;
  const earliestSafe = Number.isFinite(disabledAt) ? new Date(disabledAt + maxLegacyTtlMs) : null;

  const prisma = new PrismaClient();
  let activeV2 = 0;
  try {
    activeV2 = await prisma.authSession.count({
      where: { status: 'ACTIVE', expiresAt: { gt: new Date() } },
    });
  } catch {
    activeV2 = -1;
  } finally {
    await prisma.$disconnect();
  }

  const now = Date.now();
  const ready =
    Number.isFinite(disabledAt) &&
    earliestSafe !== null &&
    now >= earliestSafe.getTime() &&
    process.env.AUTH_SESSION_V2_ISSUE_ENABLED === 'true' &&
    process.env.AUTH_LEGACY_TOKEN_ACCEPT_ENABLED !== 'false';

  // NOT_READY until ops explicitly disables legacy acceptance after the wait.
  const status =
    Number.isFinite(disabledAt) && earliestSafe && now >= earliestSafe.getTime()
      ? 'READY_TO_DISABLE_DENYLIST_AFTER_LEGACY_ACCEPT_OFF'
      : 'NOT_READY';

  console.log(
    JSON.stringify(
      {
        legacyIssuanceDisabledAt: disabledAtRaw ?? null,
        maximumLegacyTtl: process.env.JWT_EXPIRES_IN ?? '7d',
        maximumLegacyTtlMs: maxLegacyTtlMs,
        earliestSafeDenylistDisableTime: earliestSafe?.toISOString() ?? null,
        legacyTokensObservedRecently: 'UNKNOWN (no request telemetry store)',
        v2SessionsActive: activeV2,
        authSessionV2IssueEnabled: process.env.AUTH_SESSION_V2_ISSUE_ENABLED ?? 'false',
        legacyTokenAcceptEnabled: process.env.AUTH_LEGACY_TOKEN_ACCEPT_ENABLED ?? 'true',
        legacyDenylistReadEnabled: process.env.AUTH_LEGACY_DENYLIST_READ_ENABLED ?? 'true',
        status,
        note: ready
          ? 'TTL wait elapsed; turn AUTH_LEGACY_TOKEN_ACCEPT_ENABLED=false then AUTH_LEGACY_DENYLIST_READ_ENABLED=false'
          : 'Keep denylist reads enabled',
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
