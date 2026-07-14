/** Main scroll area inset — tighter top so PageHero toolbars sit closer to the header. */
export const APP_MAIN_CONTENT_INSET = 'px-6 pt-4 pb-4';

/**
 * Height for a panel that should fill the main column without forcing page scroll.
 * Subtracts topbar (`h-16` = 4rem), main top inset (`pt-4` = 1rem), and bottom inset (`pb-4` = 1rem).
 */
export const APP_MAIN_CONTENT_FILL_HEIGHT_CLASS = 'h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)]';

/** @deprecated Prefer {@link APP_MAIN_CONTENT_FILL_HEIGHT_CLASS}. */
export const APP_MAIN_CONTENT_MAX_HEIGHT_CLASS = 'max-h-[calc(100dvh-6rem)]';
