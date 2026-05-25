import { describe, expect, it } from 'vitest';
import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import { leadStageGateFieldClass } from './lead-stage-gate-highlight';

describe('leadStageGateFieldClass', () => {
  it('highlights direct field keys', () => {
    const required = new Set(['contactName']);
    expect(leadStageGateFieldClass(required, 'contactName')).toContain(
      DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS,
    );
  });

  it('highlights phone and email when contact channel is required', () => {
    const required = new Set(['contact']);
    expect(leadStageGateFieldClass(required, 'phone')).toContain(
      DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS,
    );
    expect(leadStageGateFieldClass(required, 'email')).toContain(
      DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS,
    );
  });

  it('maps contactMethod gate to phone and email', () => {
    const required = new Set(['contactMethod']);
    expect(leadStageGateFieldClass(required, 'phone')).toContain(
      DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS,
    );
  });
});
