import { describe, expect, it } from 'vitest';
import { serializeOperationalConfiguration } from './serialize-operational-configuration';

describe('serializeOperationalConfiguration', () => {
  it('omits archived features and never includes units', () => {
    const dto = serializeOperationalConfiguration({
      id: 'cfg-1',
      productId: 'p-1',
      extensionId: null,
      mode: 'V2',
      designMode: 'FULL_DESIGN',
      aiDesignerReview: false,
      implementationBase: 'FROM_SCRATCH',
      checkedAt: null,
      draftVersion: 1,
      features: [
        {
          id: 'f-1',
          functionId: 'bank',
          origin: 'INCLUDED',
          localNote: 'Use provider X',
          workState: 'NOT_STARTED',
          archivedAt: null,
        },
        {
          id: 'f-2',
          functionId: 'old',
          origin: 'EXTRA',
          localNote: null,
          workState: 'ACCEPTED',
          archivedAt: new Date(),
        },
      ],
    });
    expect(dto.features).toHaveLength(1);
    expect(dto.features[0]?.origin).toBe('INCLUDED');
    expect(JSON.stringify(dto)).not.toMatch(/units|rate|amount/i);
  });
});
