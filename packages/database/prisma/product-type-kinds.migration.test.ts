import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OFFERED_CODE_PRODUCT_TYPES, PRODUCT_TYPES } from '@nbos/shared';

const root = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(root, 'migrations/20260921230000_product_type_kinds/migration.sql'),
  'utf8',
);

const NEW_KIND_VALUES = [
  'PRODUCT_CATALOG',
  'BLOG',
  'NEWS_MEDIA_PORTAL',
  'EVENT_WEBSITE',
  'MARKETPLACE',
  'B2B_COMMERCE_PORTAL',
  'BOOKING_SYSTEM',
  'TICKETING_SYSTEM',
  'POS',
  'HRM',
  'LMS',
  'TASK_MANAGEMENT_SYSTEM',
  'HELP_DESK_SYSTEM',
  'REGISTRATION_SYSTEM',
  'EVENT_MANAGEMENT_SYSTEM',
  'DOCUMENT_MANAGEMENT_SYSTEM',
  'INVENTORY_SYSTEM',
  'KNOWLEDGE_BASE',
  'INDUSTRY_OPERATIONS_SYSTEM',
  'BOS',
  'CUSTOMER_PORTAL',
  'PARTNER_PORTAL',
] as const;

describe('product type kinds migration', () => {
  it('adds the agreed Code kinds without dropping MOBILE_APP or SAAS', () => {
    for (const value of NEW_KIND_VALUES) {
      expect(sql).toContain(`ADD VALUE IF NOT EXISTS '${value}'`);
      expect(PRODUCT_TYPES).toContain(value);
      expect(OFFERED_CODE_PRODUCT_TYPES).toContain(value);
    }
    expect(sql).not.toMatch(/\bDROP\b/i);
    expect(PRODUCT_TYPES).toContain('MOBILE_APP');
    expect(PRODUCT_TYPES).toContain('SAAS');
    expect(OFFERED_CODE_PRODUCT_TYPES).not.toContain('MOBILE_APP');
    expect(OFFERED_CODE_PRODUCT_TYPES).not.toContain('SAAS');
  });
});
