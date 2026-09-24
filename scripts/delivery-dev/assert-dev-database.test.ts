import { describe, expect, it } from 'vitest';
import { assertDevDatabaseUrl } from './assert-dev-database';

describe('assertDevDatabaseUrl', () => {
  it('accepts the agreed development host', () => {
    expect(
      assertDevDatabaseUrl(
        'postgresql://u:p@ep-nameless-term-pooler.eu-central-1.aws.neon.tech/neondb',
        'DATABASE_URL',
      ),
    ).toContain('nameless-term');
  });

  it('refuses production', () => {
    expect(() =>
      assertDevDatabaseUrl(
        'postgresql://u:p@ep-sweet-dew.eu-central-1.aws.neon.tech/neondb',
        'DIRECT_URL',
      ),
    ).toThrow(/production/);
  });

  it('refuses any other host', () => {
    expect(() =>
      assertDevDatabaseUrl('postgresql://u:p@localhost:5432/neondb', 'DATABASE_URL'),
    ).toThrow(/nameless-term/);
  });
});
