import { describe, expect, it } from 'vitest';
import {
  applyDraftValidationSuccess,
  canSaveValidatedDraft,
  providerDraftFingerprint,
} from './provider-draft-gate';

const keyA = {
  provider: 'OPENAI' as const,
  apiKey: 'sk-key-a-xxxxxxxxxxxxxxxx',
  baseUrl: null,
};
const keyB = {
  provider: 'OPENAI' as const,
  apiKey: 'sk-key-b-xxxxxxxxxxxxxxxx',
  baseUrl: null,
};

describe('provider draft validation gate', () => {
  it('keeps Save disabled when A succeeds after the draft changed to B', () => {
    const validatedFingerprint = applyDraftValidationSuccess({
      requested: keyA,
      current: keyB,
      ok: true,
    });
    expect(validatedFingerprint).toBeNull();
    expect(canSaveValidatedDraft({ validatedFingerprint, current: keyB })).toBe(false);
  });

  it('unlocks Save only for the exact snapshot that succeeded', () => {
    const validatedFingerprint = applyDraftValidationSuccess({
      requested: keyA,
      current: keyA,
      ok: true,
    });
    expect(validatedFingerprint).toBe(providerDraftFingerprint(keyA));
    expect(canSaveValidatedDraft({ validatedFingerprint, current: keyA })).toBe(true);
    expect(canSaveValidatedDraft({ validatedFingerprint, current: keyB })).toBe(false);
  });
});
