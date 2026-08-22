import type { AiProviderConnectionView } from '@/lib/api/ai-admin';

export interface ProviderDraftSnapshot {
  provider: AiProviderConnectionView['provider'];
  apiKey: string;
  baseUrl: string | null;
}

export function providerDraftFingerprint(draft: ProviderDraftSnapshot): string {
  return `${draft.provider}\n${draft.apiKey}\n${draft.baseUrl ?? ''}`;
}

/**
 * A late success for key A must not unlock Save after the operator changed to B.
 */
export function applyDraftValidationSuccess(params: {
  requested: ProviderDraftSnapshot;
  current: ProviderDraftSnapshot;
  ok: boolean;
}): string | null {
  if (!params.ok) {
    return null;
  }
  if (providerDraftFingerprint(params.requested) !== providerDraftFingerprint(params.current)) {
    return null;
  }
  return providerDraftFingerprint(params.current);
}

export function canSaveValidatedDraft(params: {
  validatedFingerprint: string | null;
  current: ProviderDraftSnapshot;
}): boolean {
  return (
    params.validatedFingerprint !== null &&
    params.validatedFingerprint === providerDraftFingerprint(params.current)
  );
}
