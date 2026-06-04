/**
 * Vault sheet inputs are not app login — avoid `type="password"` and
 * `autocomplete="new-password"` (Chrome offers save/generate password).
 */
export const CREDENTIAL_VAULT_INPUT_IGNORE_PROPS = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'off',
  spellCheck: false,
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
  'aria-autocomplete': 'none',
} as const;

/** Mask value as bullets without `input type="password"` (no password manager UI). */
export const CREDENTIAL_VAULT_SECRET_DISC_CLASS =
  '[-webkit-text-security:disc] [text-security:disc]';
