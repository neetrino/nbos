import { describe, expect, it } from 'vitest';
import {
  META_OAUTH_ERROR_MESSAGES,
  resolveMetaOAuthErrorPresentation,
} from './meta-oauth-error-messages';

describe('resolveMetaOAuthErrorPresentation', () => {
  it('renders instagram_token_exchange_failed message', () => {
    const result = resolveMetaOAuthErrorPresentation('instagram_token_exchange_failed', 'err-1');
    expect(result.message).toBe(META_OAUTH_ERROR_MESSAGES.instagram_token_exchange_failed);
    expect(result.reason).toBe('instagram_token_exchange_failed');
    expect(result.errorId).toBe('err-1');
  });

  it('renders instagram_long_lived_token_failed message', () => {
    const result = resolveMetaOAuthErrorPresentation('instagram_long_lived_token_failed', null);
    expect(result.message).toBe(META_OAUTH_ERROR_MESSAGES.instagram_long_lived_token_failed);
  });

  it('renders instagram_profile_failed message', () => {
    const result = resolveMetaOAuthErrorPresentation('instagram_profile_failed', 'err-2');
    expect(result.message).toBe(META_OAUTH_ERROR_MESSAGES.instagram_profile_failed);
    expect(result.errorId).toBe('err-2');
  });

  it('renders instagram_response_invalid message', () => {
    const result = resolveMetaOAuthErrorPresentation('instagram_response_invalid', 'err-3');
    expect(result.message).toBe(META_OAUTH_ERROR_MESSAGES.instagram_response_invalid);
  });

  it('renders instagram_account_save_failed message', () => {
    const result = resolveMetaOAuthErrorPresentation('instagram_account_save_failed', 'err-4');
    expect(result.message).toBe(META_OAUTH_ERROR_MESSAGES.instagram_account_save_failed);
  });

  it('falls back to unknown message', () => {
    const result = resolveMetaOAuthErrorPresentation(null, 'err-unknown');
    expect(result.message).toBe(META_OAUTH_ERROR_MESSAGES.unknown);
    expect(result.reason).toBe('unknown');
    expect(result.errorId).toBe('err-unknown');
  });
});
