import { describe, expect, it } from 'vitest';
import { activeCallDirectionLabel, activeCallPhaseLabel } from './active-call-labels';

describe('activeCallDirectionLabel', () => {
  it('uses full words instead of IN/OUT', () => {
    expect(activeCallDirectionLabel('INBOUND')).toBe('Incoming');
    expect(activeCallDirectionLabel('OUTBOUND')).toBe('Outgoing');
    expect(activeCallDirectionLabel(null)).toBe('Call');
  });
});

describe('activeCallPhaseLabel', () => {
  it('capitalizes the live phase', () => {
    expect(activeCallPhaseLabel('ringing')).toBe('Ringing');
    expect(activeCallPhaseLabel('answered')).toBe('Answered');
    expect(activeCallPhaseLabel('ended')).toBe('Ended');
  });
});
