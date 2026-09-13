import { describe, expect, it } from 'vitest';
import {
  ANSI,
  assertProdDirectUrl,
  classifyMigrateStatusOutput,
  colorEnabled,
  extractPendingMigrations,
  formatMigrateStatusReport,
  paint,
  parseMigrateProdArgs,
  redactSecrets,
  resolveProdDirectUrl,
} from './migrate-prod.lib.mjs';

describe('production migrate helpers', () => {
  it('defaults to apply; --status is check only', () => {
    expect(parseMigrateProdArgs([])).toEqual({ statusOnly: false, dryRun: false, help: false });
    expect(parseMigrateProdArgs(['--status']).statusOnly).toBe(true);
  });

  it('hides connection strings', () => {
    expect(
      redactSecrets('url postgresql://user:secret@ep-prod.neon.tech/neondb?sslmode=require'),
    ).toBe('url postgresql://***');
  });

  it('accepts a Neon prod URL and refuses local hosts', () => {
    expect(
      assertProdDirectUrl('postgresql://user:pass@ep-sweet-dew.neon.tech/neondb?sslmode=require'),
    ).toBe('ep-sweet-dew.neon.tech');
    expect(() => assertProdDirectUrl('postgresql://user:pass@localhost:5432/nbos')).toThrow(
      /looks local/,
    );
  });

  it('does not fall back to local DIRECT_URL and refuses the same host', () => {
    expect(() => resolveProdDirectUrl({ DIRECT_URL: 'postgresql://u:p@localhost/db' })).toThrow(
      /DIRECT_URL_PROD/,
    );
    expect(() =>
      resolveProdDirectUrl({
        DIRECT_URL: 'postgresql://u:p@ep-same.neon.tech/db',
        DIRECT_URL_PROD: 'postgresql://u:p@ep-same.neon.tech/db',
      }),
    ).toThrow(/matches local/);
  });

  it('classifies Prisma status text', () => {
    expect(classifyMigrateStatusOutput('Database schema is up to date!')).toBe('up_to_date');
    expect(
      classifyMigrateStatusOutput('Following migration have not yet been applied:\n20260912'),
    ).toBe('pending');
    expect(classifyMigrateStatusOutput('failed migration 20260912')).toBe('blocked');
  });

  it('prints a short pending report without pnpm noise', () => {
    const prismaOut = `Following migration have not yet been applied:
20260912180000_platform_appearance

To apply migrations in production run prisma migrate deploy.
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`;
    expect(extractPendingMigrations(prismaOut)).toEqual(['20260912180000_platform_appearance']);
    const report = formatMigrateStatusReport({
      host: 'ep-prod.neon.tech',
      status: 'pending',
      pending: ['20260912180000_platform_appearance'],
      checkOnly: true,
    });
    expect(report).toContain('⚠ Pending');
    expect(report).toContain('20260912180000_platform_appearance');
    expect(report).toContain('Check only');
    expect(report).toContain('pnpm db:migrate:prod');
    expect(report).not.toContain('ERR_PNPM');
  });

  it('colors icons unless NO_COLOR is set', () => {
    expect(colorEnabled({})).toBe(true);
    expect(colorEnabled({ NO_COLOR: '1' })).toBe(false);
    expect(paint(true, ANSI.yellow, '⚠ Pending')).toContain('\u001b[33m');
    expect(paint(false, ANSI.yellow, '⚠ Pending')).toBe('⚠ Pending');
  });
});
