import { describe, expect, it } from 'vitest';
import {
  assertMessageDirectionForZone,
  assertZoneTypeCompatibility,
  defaultDirectionForZone,
  isInternalZone,
} from './messenger-core-zone';

describe('messenger-core-zone', () => {
  it('accepts INTERNAL types and rejects Client types on INTERNAL zone', () => {
    expect(() => assertZoneTypeCompatibility('INTERNAL', 'INTERNAL_GROUP')).not.toThrow();
    expect(() => assertZoneTypeCompatibility('INTERNAL', 'DIRECT')).not.toThrow();
    expect(() => assertZoneTypeCompatibility('INTERNAL', 'WORKSPACE')).not.toThrow();
    expect(() => assertZoneTypeCompatibility('INTERNAL', 'EXTERNAL')).toThrow(
      /cannot use a Client type/,
    );
  });

  it('accepts EXTERNAL on CLIENT zone and rejects Internal types', () => {
    expect(() => assertZoneTypeCompatibility('CLIENT', 'EXTERNAL')).not.toThrow();
    expect(() => assertZoneTypeCompatibility('CLIENT', 'DIRECT')).toThrow(
      /cannot use an Internal type/,
    );
    expect(() => assertZoneTypeCompatibility('CLIENT', 'PRODUCT')).toThrow(
      /cannot use an Internal type/,
    );
  });

  it('defaults and validates message direction from zone', () => {
    expect(defaultDirectionForZone('INTERNAL')).toBe('INTERNAL');
    expect(defaultDirectionForZone('CLIENT')).toBe('OUTBOUND');
    expect(() => assertMessageDirectionForZone('INTERNAL', 'OUTBOUND')).toThrow();
    expect(() => assertMessageDirectionForZone('INTERNAL', 'INBOUND')).toThrow();
    expect(() => assertMessageDirectionForZone('CLIENT', 'INTERNAL')).toThrow();
    expect(() => assertMessageDirectionForZone('CLIENT', 'INBOUND')).not.toThrow();
    expect(isInternalZone('INTERNAL')).toBe(true);
    expect(isInternalZone('CLIENT')).toBe(false);
  });
});

describe('zone immutability contract', () => {
  it('does not expose a zone-update helper (zone is create-time only)', async () => {
    const zoneModule = await import('./messenger-core-zone');
    expect('updateConversationZone' in zoneModule).toBe(false);
    expect('setZone' in zoneModule).toBe(false);
  });
});
