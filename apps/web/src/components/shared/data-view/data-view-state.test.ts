import { describe, expect, it } from 'vitest';
import { isRevalidating, resolveDataViewState } from './data-view-state';

describe('resolveDataViewState', () => {
  it('shows the skeleton only on the first load', () => {
    expect(resolveDataViewState({ loading: true, hasData: false })).toBe('loading');
  });

  it('keeps content mounted while it is revalidated', () => {
    expect(resolveDataViewState({ loading: true, hasData: true })).toBe('ready');
  });

  it('keeps content mounted when a revalidation fails', () => {
    expect(resolveDataViewState({ loading: false, error: 'Network error', hasData: true })).toBe(
      'ready',
    );
  });

  it('shows the error screen when the first load fails', () => {
    expect(resolveDataViewState({ loading: false, error: 'Network error', hasData: false })).toBe(
      'error',
    );
  });

  it('shows the empty state when a successful load returned nothing', () => {
    expect(resolveDataViewState({ loading: false, error: null, hasData: false })).toBe('empty');
  });

  it('treats a missing error as no error', () => {
    expect(resolveDataViewState({ loading: false, hasData: false })).toBe('empty');
  });
});

describe('isRevalidating', () => {
  it('is true only when a fetch runs over content that is already on screen', () => {
    expect(isRevalidating({ loading: true, hasData: true })).toBe(true);
    expect(isRevalidating({ loading: true, hasData: false })).toBe(false);
    expect(isRevalidating({ loading: false, hasData: true })).toBe(false);
  });
});
