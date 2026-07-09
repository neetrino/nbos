export const META_OAUTH_ERROR_MESSAGES = {
  missing_code: 'Meta authorization was incomplete. No account was connected.',
  access_denied: 'Meta access was denied. Account was not connected.',
  invalid_state: 'Meta authorization expired. Please try connecting again.',
  token_exchange_failed: 'Meta token exchange failed. Check app credentials.',
  instagram_token_exchange_failed:
    'Instagram authorization succeeded, but NBOS could not exchange the authorization code. Verify the Instagram app credentials.',
  instagram_long_lived_token_failed:
    'Instagram connected, but NBOS could not create a long-lived access token.',
  instagram_profile_failed:
    'Instagram authorized successfully, but NBOS could not load the Instagram account information.',
  instagram_response_invalid:
    'Instagram returned an unexpected API response. Please check the server diagnostic log.',
  instagram_account_save_failed:
    'Instagram authorization succeeded, but NBOS could not save the connected account.',
  meta_callback_failed: 'Instagram authorization returned to NBOS, but callback processing failed.',
  missing_pages: 'No Facebook Pages were found for this Meta account.',
  not_configured: 'Meta integration is not configured on the server.',
  unknown: 'Meta connection failed. Please try again.',
} as const satisfies Record<string, string>;

export interface MetaOAuthErrorPresentation {
  message: string;
  reason: string;
  errorId: string | null;
}

export function resolveMetaOAuthErrorPresentation(
  reason: string | null,
  errorId: string | null,
): MetaOAuthErrorPresentation {
  const normalizedReason = reason ?? 'unknown';
  const knownMessage =
    META_OAUTH_ERROR_MESSAGES[normalizedReason as keyof typeof META_OAUTH_ERROR_MESSAGES];
  const message = knownMessage ?? META_OAUTH_ERROR_MESSAGES.unknown;
  return {
    message,
    reason: normalizedReason,
    errorId,
  };
}
