export const MOBILE_DOCK_HEIGHT_CLASS = 'h-[var(--nbos-mobile-dock-height)]';

export const MOBILE_DOCK_ROW_CLASS = 'flex h-full items-stretch px-6';

export const MOBILE_DOCK_ICON_SIZE_PX = 18;

/** Shared glyph + label tracks so every icon sits on the same baseline. */
export const MOBILE_DOCK_ITEM_CLASS =
  'grid h-full min-w-0 flex-1 grid-rows-[2rem_1rem] content-center justify-items-center px-0.5';

export const MOBILE_DOCK_ITEM_GLYPH_CLASS =
  'flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:block [&_svg]:shrink-0';

export const MOBILE_DOCK_ITEM_LABEL_CLASS =
  'block h-4 w-full min-w-0 overflow-hidden text-center text-[10px] leading-4 font-semibold tracking-wide text-ellipsis whitespace-nowrap';

export const MOBILE_DOCK_ITEM_IDLE_CLASS =
  'bg-transparent text-muted-foreground hover:text-foreground';

export const MOBILE_DOCK_ITEM_ACTIVE_CLASS = 'bg-primary/12 text-primary';

export const MOBILE_DOCK_ITEM_DISABLED_CLASS = 'bg-transparent text-muted-foreground/50';
