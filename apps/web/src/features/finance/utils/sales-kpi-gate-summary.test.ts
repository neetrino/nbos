import { describe, expect, it } from 'vitest';
import enPayroll from '@/messages/en/payroll.json';
import type { PayrollTranslator } from '@/features/finance/components/payroll/payroll-compensation-i18n';
import type { MessageLeafKeys } from '@/i18n/message-leaf-keys';
import {
  buildSalesKpiGateSummary,
  salesKpiPayoutScaleLabel,
  salesKpiPayoutScaleMessageKey,
} from './sales-kpi-gate-summary';

type PayrollMessageKey = MessageLeafKeys<typeof enPayroll>;

function getMessageByPath(catalog: Record<string, unknown>, path: string): string {
  const value = path.split('.').reduce<unknown>((node, segment) => {
    if (node && typeof node === 'object' && segment in node) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, catalog);
  return typeof value === 'string' ? value : path;
}

const t: PayrollTranslator = (key, values) => {
  let message = getMessageByPath(enPayroll as Record<string, unknown>, key as PayrollMessageKey);
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
  }
  return message;
};

describe('salesKpiPayoutScaleMessageKey', () => {
  it('returns full scale at 70%+', () => {
    expect(salesKpiPayoutScaleMessageKey(1000, 700)).toBe('compensation.kpi.scale.full');
  });

  it('returns half scale between 50% and 70%', () => {
    expect(salesKpiPayoutScaleMessageKey(1000, 600)).toBe('compensation.kpi.scale.half');
  });

  it('returns zero below 50%', () => {
    expect(salesKpiPayoutScaleMessageKey(1000, 400)).toBe('compensation.kpi.scale.zero');
  });
});

describe('salesKpiPayoutScaleLabel', () => {
  it('returns localized full scale at 70%+', () => {
    expect(salesKpiPayoutScaleLabel(1000, 700, t)).toBe('100%');
  });
});

describe('buildSalesKpiGateSummary', () => {
  it('returns null when KPI unset', () => {
    expect(buildSalesKpiGateSummary(null, null, t)).toBeNull();
  });

  it('describes attainment when both set', () => {
    const summary = buildSalesKpiGateSummary('1000', '600', t);
    expect(summary).toContain('60%');
    expect(summary).toContain('50%');
  });
});
