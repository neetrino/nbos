import { describe, expect, it } from 'vitest';
import {
  listResolvedRetentionRules,
  resolveRetentionDaysForEntity,
  resolveRetentionMsForEntity,
} from './platform-retention-rules.resolver';

describe('platform-retention-rules.resolver', () => {
  it('returns registry default when env unset', () => {
    expect(resolveRetentionDaysForEntity('contact', 30, {})).toBe(30);
    expect(resolveRetentionMsForEntity('credential', {})).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('applies global default env override', () => {
    expect(
      resolveRetentionDaysForEntity('lead', 30, { PLATFORM_TRASH_RETENTION_DAYS_DEFAULT: '45' }),
    ).toBe(45);
  });

  it('applies per-entity env override over global', () => {
    const env = {
      PLATFORM_TRASH_RETENTION_DAYS_DEFAULT: '45',
      PLATFORM_TRASH_RETENTION_DAYS_DRIVE_FILE: '14',
    };
    expect(resolveRetentionDaysForEntity('drive_file', 30, env)).toBe(14);
    expect(resolveRetentionDaysForEntity('deal', 30, env)).toBe(45);
  });

  it('lists resolved rules with automation flags', () => {
    const rules = listResolvedRetentionRules({});
    expect(rules.find((row) => row.key === 'credential')?.automatedPurge).toBe(true);
    expect(rules.find((row) => row.key === 'contact')?.automatedPurge).toBe(false);
  });
});
