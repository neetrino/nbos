import { describe, expect, it } from 'vitest';
import { CALL_SSE_EVENT } from '../../realtime/call-realtime.constants';
import { inboundStart } from './ats-call.test-harness';
import {
  isAtsTerminalState,
  mapAtsStateToPhase,
  resolveCallLifecycleEvent,
  storedStateMatchesLifecycleEvent,
} from './ats-call-realtime.phase';
import { resolveLifecycleTarget } from './ats-call-realtime.target';

describe('resolveCallLifecycleEvent', () => {
  it('maps inbound start to call.started', () => {
    expect(resolveCallLifecycleEvent(inboundStart(), true)).toBe(CALL_SSE_EVENT.STARTED);
  });

  it('maps status to call.answered', () => {
    expect(resolveCallLifecycleEvent(inboundStart({ state: 'status' }), false)).toBe(
      CALL_SSE_EVENT.ANSWERED,
    );
  });

  it('does not open a window on first-seen finish', () => {
    expect(resolveCallLifecycleEvent(inboundStart({ state: 'finish' }), true)).toBeNull();
  });

  it('maps later finish to call.finished', () => {
    expect(resolveCallLifecycleEvent(inboundStart({ state: 'finish' }), false)).toBe(
      CALL_SSE_EVENT.FINISHED,
    );
  });
});

describe('storedStateMatchesLifecycleEvent', () => {
  it('rejects a late start after finish and a late ringing after answered', () => {
    expect(storedStateMatchesLifecycleEvent('finish', CALL_SSE_EVENT.STARTED)).toBe(false);
    expect(storedStateMatchesLifecycleEvent('status', CALL_SSE_EVENT.STARTED)).toBe(false);
    expect(storedStateMatchesLifecycleEvent('start', CALL_SSE_EVENT.STARTED)).toBe(true);
    expect(storedStateMatchesLifecycleEvent('status', CALL_SSE_EVENT.ANSWERED)).toBe(true);
    expect(storedStateMatchesLifecycleEvent('finish', CALL_SSE_EVENT.FINISHED)).toBe(true);
  });
});

describe('mapAtsStateToPhase', () => {
  it('maps ATS states to screen phases', () => {
    expect(mapAtsStateToPhase('initiated')).toBe('ringing');
    expect(mapAtsStateToPhase('start')).toBe('ringing');
    expect(mapAtsStateToPhase('status')).toBe('answered');
    expect(mapAtsStateToPhase('finish')).toBe('ended');
    expect(mapAtsStateToPhase('end')).toBe('ended');
  });
});

describe('isAtsTerminalState', () => {
  it('treats finish and end as terminal after ATS normalization', () => {
    expect(isAtsTerminalState('finish')).toBe(true);
    expect(isAtsTerminalState('END')).toBe(true);
    expect(isAtsTerminalState('start')).toBe(false);
    expect(isAtsTerminalState('status')).toBe(false);
    expect(isAtsTerminalState('initiated')).toBe(false);
  });
});

describe('resolveLifecycleTarget', () => {
  const employees = {
    initiatedByEmployeeId: 'emp-init',
    responsibleEmployeeId: 'emp-resp',
    answeredEmployeeId: 'emp-ans',
    initiatedByEmployee: { firstName: 'Init', lastName: 'I' },
    responsibleEmployee: { firstName: 'Resp', lastName: 'R' },
    answeredEmployee: { firstName: 'Ans', lastName: 'A' },
  };

  it('sends inbound start only to the redirect responsible', () => {
    expect(resolveLifecycleTarget(inboundStart(), employees)?.employeeId).toBe('emp-resp');
  });

  it('skips inbound start when there is no SIP responsible', () => {
    expect(
      resolveLifecycleTarget(inboundStart(), {
        ...employees,
        responsibleEmployeeId: null,
        responsibleEmployee: null,
      }),
    ).toBeNull();
  });

  it('sends inbound answered to the op employee', () => {
    expect(
      resolveLifecycleTarget(inboundStart({ state: 'status', op: '3126107' }), employees)
        ?.employeeId,
    ).toBe('emp-ans');
  });

  it('sends outbound to the initiator', () => {
    expect(resolveLifecycleTarget(inboundStart({ calldirect: '1' }), employees)?.employeeId).toBe(
      'emp-init',
    );
  });
});
