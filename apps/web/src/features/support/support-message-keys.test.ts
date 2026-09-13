import { describe, expect, it } from 'vitest';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import type { AuditLogEntry } from '@/lib/api/audit';
import enSupport from '@/messages/en/support.json';
import ruSupport from '@/messages/ru/support.json';
import { formatSupportAuditTimestamp } from './components/support-ticket-detail-helpers';
import {
  formatSupportAuditLine,
  SUPPORT_AUDIT_ACTION_MESSAGE_KEYS,
  SUPPORT_STATUS_MESSAGE_KEYS,
  SUPPORT_WAITING_MESSAGE_KEYS,
  type SupportTranslator,
} from './support-message-keys';

function readCatalogString(catalog: typeof enSupport, key: string): string {
  let current: unknown = catalog;
  for (const part of key.split('.')) {
    if (typeof current !== 'object' || current === null) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : key;
}

function catalogTranslator(catalog: typeof enSupport): SupportTranslator {
  return (key, values) =>
    readCatalogString(catalog, key).replace(/\{(\w+)\}/g, (_match, name: string) =>
      String(values?.[name] ?? ''),
    );
}

function auditEntry(partial: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 'a1',
    projectId: null,
    entityType: 'SupportTicket',
    entityId: 't1',
    action: 'support.status_changed',
    userId: null,
    changes: { from: 'NEW', to: 'TRIAGED' },
    ipAddress: null,
    createdAt: '2026-01-15T12:00:00.000Z',
    actor: null,
    ...partial,
  };
}

describe('support ticket sheet catalog', () => {
  it('keeps EN/RU keys aligned', () => {
    expect(flattenMessageKeys(enSupport).sort()).toEqual(flattenMessageKeys(ruSupport).sort());
  });

  it('keeps ICU placeholders for interpolated sheet copy', () => {
    expect(enSupport.sheet.extensionDeal).toContain('{code}');
    expect(ruSupport.sheet.extensionDeal).toContain('{code}');
    expect(enSupport.errors.resolutionMinLength).toContain('{min}');
    expect(ruSupport.errors.resolutionMinLength).toContain('{min}');
    expect(enSupport.audit.change).toContain('{action}');
    expect(enSupport.audit.change).toContain('{from}');
    expect(enSupport.audit.change).toContain('{to}');
    expect(ruSupport.audit.change).toContain('{action}');
    expect(ruSupport.audit.change).toContain('{from}');
    expect(ruSupport.audit.change).toContain('{to}');
    expect(enSupport.technical.namedOption).toContain('{kind}');
    expect(enSupport.technical.namedOption).toContain('{name}');
    expect(ruSupport.technical.namedOption).toContain('{kind}');
    expect(ruSupport.technical.namedOption).toContain('{name}');
  });
});

describe('formatSupportAuditLine', () => {
  it('translates status change labels and interpolates the change template', () => {
    const line = formatSupportAuditLine(auditEntry(), catalogTranslator(enSupport));
    expect(line).toBe(
      `${enSupport.audit.actions.statusChanged}: ${enSupport.status.NEW} → ${enSupport.status.TRIAGED}`,
    );
  });

  it('translates waiting overlay changes via waiting keys', () => {
    const line = formatSupportAuditLine(
      auditEntry({
        action: 'support.waiting_changed',
        changes: { from: 'NONE', to: 'WAITING_FOR_CLIENT' },
      }),
      catalogTranslator(ruSupport),
    );
    expect(line).toBe(
      `${ruSupport.audit.actions.waitingChanged}: ${ruSupport.waiting.NONE} → ${ruSupport.waiting.WAITING_FOR_CLIENT}`,
    );
  });

  it('keeps unknown action codes as codes', () => {
    const line = formatSupportAuditLine(
      auditEntry({ action: 'support.unknown_event', changes: null }),
      catalogTranslator(enSupport),
    );
    expect(line).toBe('support.unknown_event');
  });

  it('maps every known audit action to a catalog key', () => {
    expect(Object.keys(SUPPORT_AUDIT_ACTION_MESSAGE_KEYS)).toEqual([
      'support.status_changed',
      'support.closed_extension_delivered',
      'support.reopened',
      'support.waiting_changed',
      'support.escalation_manager',
    ]);
    expect(SUPPORT_STATUS_MESSAGE_KEYS.IN_PROGRESS).toBe('status.IN_PROGRESS');
    expect(SUPPORT_WAITING_MESSAGE_KEYS.NONE).toBe('waiting.NONE');
  });
});

describe('formatSupportAuditTimestamp', () => {
  it('formats with the requested locale', () => {
    const en = formatSupportAuditTimestamp('2026-01-15T12:00:00.000Z', 'en');
    const ru = formatSupportAuditTimestamp('2026-01-15T12:00:00.000Z', 'ru');
    expect(en.length).toBeGreaterThan(0);
    expect(ru.length).toBeGreaterThan(0);
  });
});
