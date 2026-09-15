import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  FRONTEND_REQUIRES_BACKEND_MESSAGE,
  assertFrontendRequiresBackend,
  assertProductDeveloperSlotsForUpdate,
  mergeProductDeveloperSlotIds,
} from './product-developer-slots';

const BACKEND_ID = 'dev-be';
const FRONTEND_ID = 'dev-fe';

describe('assertFrontendRequiresBackend', () => {
  it('allows the same person on both developer slots', () => {
    expect(() => assertFrontendRequiresBackend(BACKEND_ID, BACKEND_ID)).not.toThrow();
  });

  it('allows two different developers', () => {
    expect(() => assertFrontendRequiresBackend(BACKEND_ID, FRONTEND_ID)).not.toThrow();
  });

  it('allows Backend only or both empty', () => {
    expect(() => assertFrontendRequiresBackend(BACKEND_ID, null)).not.toThrow();
    expect(() => assertFrontendRequiresBackend(null, null)).not.toThrow();
    expect(() => assertFrontendRequiresBackend(undefined, undefined)).not.toThrow();
  });

  it('rejects Frontend without Backend', () => {
    expect(() => assertFrontendRequiresBackend(null, FRONTEND_ID)).toThrow(BadRequestException);
    expect(() => assertFrontendRequiresBackend(undefined, FRONTEND_ID)).toThrow(
      FRONTEND_REQUIRES_BACKEND_MESSAGE,
    );
    expect(() => assertFrontendRequiresBackend('', FRONTEND_ID)).toThrow(BadRequestException);
  });

  it('rejects a merged clear-Backend patch that leaves Frontend set', () => {
    const previousFrontend = FRONTEND_ID;
    const mergedBackend = null;
    const mergedFrontend = previousFrontend;
    expect(() => assertFrontendRequiresBackend(mergedBackend, mergedFrontend)).toThrow(
      FRONTEND_REQUIRES_BACKEND_MESSAGE,
    );
  });
});

describe('mergeProductDeveloperSlotIds', () => {
  it('keeps current ids when the patch omits both slots', () => {
    expect(
      mergeProductDeveloperSlotIds(
        { developerId: BACKEND_ID, frontendDeveloperId: FRONTEND_ID },
        {},
      ),
    ).toEqual({ developerId: BACKEND_ID, frontendDeveloperId: FRONTEND_ID });
  });

  it('applies only the patched slot', () => {
    expect(
      mergeProductDeveloperSlotIds(
        { developerId: BACKEND_ID, frontendDeveloperId: null },
        { frontendDeveloperId: FRONTEND_ID },
      ),
    ).toEqual({ developerId: BACKEND_ID, frontendDeveloperId: FRONTEND_ID });
  });
});

describe('assertProductDeveloperSlotsForUpdate', () => {
  it('allows same-person and two-person patches against a locked Backend row', () => {
    const current = { developerId: BACKEND_ID, frontendDeveloperId: null };
    expect(() =>
      assertProductDeveloperSlotsForUpdate(current, { frontendDeveloperId: BACKEND_ID }),
    ).not.toThrow();
    expect(() =>
      assertProductDeveloperSlotsForUpdate(current, { frontendDeveloperId: FRONTEND_ID }),
    ).not.toThrow();
  });

  it('rejects clearing Backend while Frontend stays set', () => {
    expect(() =>
      assertProductDeveloperSlotsForUpdate(
        { developerId: BACKEND_ID, frontendDeveloperId: FRONTEND_ID },
        { developerId: null },
      ),
    ).toThrow(FRONTEND_REQUIRES_BACKEND_MESSAGE);
  });

  /**
   * Concurrent partial PUTs serialize on FOR UPDATE. After a clear-Backend
   * commit, the next writer must see empty Backend and fail a Frontend-only set.
   */
  it('rejects a Frontend-only patch after a serialized clear-Backend write', () => {
    const afterClearBackend = { developerId: null, frontendDeveloperId: null };
    expect(() =>
      assertProductDeveloperSlotsForUpdate(afterClearBackend, {
        frontendDeveloperId: FRONTEND_ID,
      }),
    ).toThrow(FRONTEND_REQUIRES_BACKEND_MESSAGE);
  });
});
