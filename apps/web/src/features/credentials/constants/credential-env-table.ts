/** Initial visible ENV rows in credential sheet; use “Show all” to expand. */
export const CREDENTIAL_ENV_TABLE_PREVIEW_ROWS = 6;

/** Shown in Value when the variable exists in vault but is not revealed. */
export const ENV_TABLE_VALUE_MASK_DISPLAY = '••••••••';

/** Shown in Value when the row has no value yet (editable). */
export const ENV_TABLE_VALUE_EMPTY_PLACEHOLDER = 'Enter value';

export const ENV_TABLE_CONFIRM_REMOVE_TITLE = 'Remove variable?';
export const ENV_TABLE_CONFIRM_REMOVE_DESCRIPTION =
  'This key and its value will be removed from the bundle.';

export const ENV_TABLE_CONFIRM_KEY_OVERWRITE_TITLE = 'Replace duplicate key?';
export const ENV_TABLE_CONFIRM_KEY_OVERWRITE_DESCRIPTION =
  'Another row already uses this key. The existing value will be replaced.';

export const ENV_TABLE_CONFIRM_PASTE_REPLACE_TITLE = 'Replace all variables?';
export const ENV_TABLE_CONFIRM_PASTE_REPLACE_DESCRIPTION =
  'All current variables will be removed and replaced with the pasted lines.';

export const ENV_TABLE_CONFIRM_PASTE_MERGE_TITLE = 'Overwrite existing variables?';
export const ENV_TABLE_CONFIRM_PASTE_MERGE_DESCRIPTION =
  'Merge will overwrite stored or edited values for matching keys.';
