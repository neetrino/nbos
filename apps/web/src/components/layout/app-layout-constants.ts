/** Main scroll area inset — tighter top so PageHero toolbars sit closer to the header. */
export const APP_MAIN_CONTENT_INSET = 'px-6 pt-4 pb-6';

/**
 * Max height for a panel that should fill the main scroll column without forcing page scroll.
 * Subtracts topbar (`h-16` = 4rem) and vertical main inset (`pt-4` + `pb-6` = 2.5rem).
 */
export const APP_MAIN_CONTENT_MAX_HEIGHT_CLASS = 'max-h-[calc(100dvh-6.5rem)]';
