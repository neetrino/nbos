/**
 * Visual tokens shared by {@link MessengerThread} and embedded contexts (e.g. task sheet).
 * Keep in sync with messenger thread styling.
 */
export const MESSENGER_THREAD_ACCENT_HEX = '#E5A84B';

export const MESSENGER_THREAD_COMPOSER_SURFACE_HEX = '#F5F5F0';

/** Hash icon in thread header (channel + embedded task thread). */
export const MESSENGER_THREAD_HASH_ICON_CLASS = 'text-[#E5A84B]';

/** Tailwind classes for the single-line composer input (matches MessengerThread). */
export const MESSENGER_THREAD_COMPOSER_INPUT_CLASS =
  'flex-1 rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-3 py-2 text-sm text-black placeholder:text-black/35 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none disabled:opacity-50';

/** Attachment field row (full messenger composer only). */
export const MESSENGER_THREAD_ATTACHMENT_INPUT_CLASS =
  'mt-2 w-full rounded-lg border border-black/[0.08] bg-[#F5F5F0] px-3 py-1.5 text-xs text-black placeholder:text-black/30 focus:ring-2 focus:ring-[#E5A84B]/30 focus:outline-none disabled:opacity-50';
