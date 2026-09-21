import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api-errors';
import {
  REPLACEMENT_CONFLICT_CODE,
  REPLACEMENT_CONFLICT_HTTP_STATUS,
} from './replace-assignee.constants';
import {
  buildReplaceEmployeeBody,
  canSubmitReplacement,
  componentsHeldBy,
  createEmptyShareDrafts,
  isReplacementConflictError,
  shareValidationError,
  uniqueHolders,
  type ReplacementSubmitInput,
  type ShareDraft,
} from './replace-assignee-form';

const COMPONENT_A = 'component-a';
const COMPONENT_B = 'component-b';
const FROM_EMPLOYEE = 'emp-out';
const TO_EMPLOYEE = 'emp-in';

function validShares(): ShareDraft[] {
  return [
    { componentId: COMPONENT_A, outgoingPercent: '40', incomingPercent: '60' },
    { componentId: COMPONENT_B, outgoingPercent: '70', incomingPercent: '30' },
  ];
}

function validInput(overrides: Partial<ReplacementSubmitInput> = {}): ReplacementSubmitInput {
  const shares = overrides.shares ?? validShares();
  return {
    roleKey: 'BACKEND',
    fromEmployeeId: FROM_EMPLOYEE,
    toEmployeeId: TO_EMPLOYEE,
    reason: 'Hand over remaining work',
    shares,
    componentIds: shares.map((share) => share.componentId),
    expectedRevision: 3,
    ...overrides,
  };
}

describe('createEmptyShareDrafts', () => {
  it('starts every percent empty and never prefills 100/0 or 50/50', () => {
    const drafts = createEmptyShareDrafts([COMPONENT_A, COMPONENT_B]);
    expect(drafts).toEqual([
      { componentId: COMPONENT_A, outgoingPercent: '', incomingPercent: '' },
      { componentId: COMPONENT_B, outgoingPercent: '', incomingPercent: '' },
    ]);
    for (const draft of drafts) {
      expect(draft.outgoingPercent).toBe('');
      expect(draft.incomingPercent).toBe('');
    }
  });
});

describe('shareValidationError', () => {
  it('treats empty fields as not decided yet', () => {
    expect(
      shareValidationError({
        componentId: COMPONENT_A,
        outgoingPercent: '',
        incomingPercent: '',
      }),
    ).toBe('REDISTRIBUTION_REQUIRED');
  });

  it('rejects a pair that does not sum to 100', () => {
    expect(
      shareValidationError({
        componentId: COMPONENT_A,
        outgoingPercent: '40',
        incomingPercent: '50',
      }),
    ).toBe('SHARE_PERCENT_TOTAL');
  });

  it('accepts an explicit 40/60 pair', () => {
    expect(
      shareValidationError({
        componentId: COMPONENT_A,
        outgoingPercent: '40',
        incomingPercent: '60',
      }),
    ).toBeNull();
  });
});

describe('canSubmitReplacement', () => {
  it('blocks submit while any pair is empty or the reason is blank', () => {
    expect(
      canSubmitReplacement(validInput({ shares: createEmptyShareDrafts([COMPONENT_A]) })),
    ).toBe(false);
    expect(canSubmitReplacement(validInput({ reason: '   ' }))).toBe(false);
  });

  it('blocks replacing an employee with themselves', () => {
    expect(canSubmitReplacement(validInput({ toEmployeeId: FROM_EMPLOYEE }))).toBe(false);
  });

  it('blocks submit when a component from the plan is missing', () => {
    expect(
      canSubmitReplacement(
        validInput({
          shares: validShares().slice(0, 1),
          componentIds: [COMPONENT_A, COMPONENT_B],
        }),
      ),
    ).toBe(false);
  });

  it('allows submit only when every pair is valid', () => {
    expect(canSubmitReplacement(validInput())).toBe(true);
  });
});

describe('buildReplaceEmployeeBody', () => {
  it('returns null instead of sending undecided percents', () => {
    expect(
      buildReplaceEmployeeBody(
        validInput({ shares: createEmptyShareDrafts([COMPONENT_A, COMPONENT_B]) }),
      ),
    ).toBeNull();
  });

  it('includes every component and the expected revision', () => {
    expect(buildReplaceEmployeeBody(validInput())).toEqual({
      roleKey: 'BACKEND',
      fromEmployeeId: FROM_EMPLOYEE,
      toEmployeeId: TO_EMPLOYEE,
      shares: validShares(),
      reason: 'Hand over remaining work',
      expectedRevision: 3,
    });
  });

  it('omits expectedRevision when the plan has none', () => {
    const body = buildReplaceEmployeeBody(validInput({ expectedRevision: null }));
    expect(body).not.toBeNull();
    expect(body).not.toHaveProperty('expectedRevision');
  });
});

describe('uniqueHolders', () => {
  it('keeps first-seen holders across components', () => {
    const holders = uniqueHolders([
      {
        componentId: COMPONENT_A,
        componentKey: 'BASE',
        kind: 'BASE',
        holders: [
          {
            allocationId: 'a1',
            employeeId: FROM_EMPLOYEE,
            employeeName: 'Ada',
            hasReleases: true,
          },
        ],
      },
      {
        componentId: COMPONENT_B,
        componentKey: 'FEATURE',
        kind: 'FEATURE',
        holders: [
          {
            allocationId: 'b1',
            employeeId: FROM_EMPLOYEE,
            employeeName: 'Ada',
            hasReleases: false,
          },
          {
            allocationId: 'b2',
            employeeId: TO_EMPLOYEE,
            employeeName: 'Bob',
            hasReleases: false,
          },
        ],
      },
    ]);
    expect(holders.map((holder) => holder.employeeId)).toEqual([FROM_EMPLOYEE, TO_EMPLOYEE]);
  });
});

describe('isReplacementConflictError', () => {
  it('detects HTTP 409 and the configuration conflict code', () => {
    expect(
      isReplacementConflictError(
        new ApiError('changed', {
          statusCode: REPLACEMENT_CONFLICT_HTTP_STATUS,
          code: REPLACEMENT_CONFLICT_CODE,
        }),
      ),
    ).toBe(true);
    expect(
      isReplacementConflictError(new ApiError('missing', { code: 'REDISTRIBUTION_REQUIRED' })),
    ).toBe(false);
  });
});

describe('componentsHeldBy', () => {
  const components = [
    {
      componentId: COMPONENT_A,
      componentKey: 'BASE',
      kind: 'BASE_PROFILE',
      holders: [
        {
          allocationId: 'alloc-1',
          employeeId: FROM_EMPLOYEE,
          employeeName: 'Outgoing',
          hasReleases: false,
        },
      ],
    },
    {
      componentId: COMPONENT_B,
      componentKey: 'FEATURE',
      kind: 'FEATURE',
      holders: [
        {
          allocationId: 'alloc-2',
          employeeId: 'emp-other',
          employeeName: 'Someone else',
          hasReleases: false,
        },
      ],
    },
  ];

  it('keeps only components the outgoing employee holds', () => {
    expect(componentsHeldBy(components, FROM_EMPLOYEE).map((row) => row.componentId)).toEqual([
      COMPONENT_A,
    ]);
  });

  it('returns nothing before an outgoing employee is chosen', () => {
    expect(componentsHeldBy(components, '')).toEqual([]);
  });

  it('returns nothing when the employee holds no component of this role', () => {
    expect(componentsHeldBy(components, 'emp-unrelated')).toEqual([]);
  });
});
