import { describe, expect, it } from 'vitest';
import { activeCallDirectionLabelKey, activeCallPhaseLabelKey } from './active-call-labels';

describe('activeCallDirectionLabelKey', () => {
  it('uses full words instead of IN/OUT', () => {
    expect(activeCallDirectionLabelKey('INBOUND')).toBe('calls.incoming');
    expect(activeCallDirectionLabelKey('OUTBOUND')).toBe('calls.outgoing');
    expect(activeCallDirectionLabelKey(null)).toBe('calls.call');
  });
});

describe('activeCallPhaseLabelKey', () => {
  it('maps live phases to message keys', () => {
    expect(activeCallPhaseLabelKey('ringing')).toBe('calls.phase.ringing');
    expect(activeCallPhaseLabelKey('answered')).toBe('calls.phase.answered');
    expect(activeCallPhaseLabelKey('ended')).toBe('calls.phase.ended');
  });
});
