import { describe, expect, it } from 'vitest';
import { parseConfigurationParametersBody } from './configuration-parameters-write';
import { CatalogContentValidationError } from './catalog-write';

describe('parseConfigurationParametersBody', () => {
  it('returns frozen axes for an empty or missing body', () => {
    expect(parseConfigurationParametersBody({})).toEqual({
      implementationBase: 'FROM_SCRATCH',
      designMode: 'AI_DESIGN',
      aiDesignerReview: false,
    });
    expect(parseConfigurationParametersBody(undefined)).toEqual({
      implementationBase: 'FROM_SCRATCH',
      designMode: 'AI_DESIGN',
      aiDesignerReview: false,
    });
  });

  it('ignores client-supplied axes', () => {
    expect(
      parseConfigurationParametersBody({
        implementationBase: 'WHITE_LABEL',
        designMode: 'FULL_DESIGN',
        aiDesignerReview: true,
      }),
    ).toEqual({
      implementationBase: 'FROM_SCRATCH',
      designMode: 'AI_DESIGN',
      aiDesignerReview: false,
    });
  });

  it('rejects a non-object body', () => {
    expect(() => parseConfigurationParametersBody('FROM_SCRATCH')).toThrow(
      CatalogContentValidationError,
    );
  });
});
