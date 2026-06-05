import { APP_MAIN_CONTENT_MAX_HEIGHT_CLASS } from '@/components/layout/app-layout-constants';

/** Right sidebar width on project detail (+20% vs prior 20rem / 22rem). */
export const PROJECT_DETAIL_SIDEBAR_CLASS = 'w-full shrink-0 lg:w-96 xl:w-[26.4rem]';

/** Sticky info panel — flush to viewport right/bottom below topbar + main inset. */
export const PROJECT_DETAIL_SIDEBAR_STICKY_CLASS = [
  'lg:sticky lg:top-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden',
  APP_MAIN_CONTENT_MAX_HEIGHT_CLASS,
  'lg:min-h-[calc(100dvh-5rem)]',
].join(' ');

/** Sidebar meets viewport right edge (counteracts main `px-6`). */
export const PROJECT_DETAIL_SIDEBAR_EDGE_CLASS = [
  PROJECT_DETAIL_SIDEBAR_STICKY_CLASS,
  '-mr-6 rounded-none border-y-0 border-r-0 lg:rounded-l-xl lg:border-l',
].join(' ');

export const PROJECT_DETAIL_PAGE_ROW_CLASS =
  'flex min-h-0 flex-1 flex-col gap-6 lg:min-h-[calc(100dvh-5rem)] lg:flex-row lg:gap-0';

export const PROJECT_DETAIL_MAIN_COLUMN_CLASS = 'flex min-w-0 flex-1 flex-col gap-6 lg:pr-6';

export type ProjectDetailViewMode = 'card' | 'list';

/** @deprecated Use {@link ProjectDetailViewMode}. */
export type ProjectProductsViewMode = ProjectDetailViewMode;

/** List panel — one white card; rows separated by dividers (not merged into page bg). */
export const PROJECT_ENTITY_LIST_CLASS =
  'bg-card border-border divide-border divide-y overflow-hidden rounded-xl border';

/** Row inside {@link PROJECT_ENTITY_LIST_CLASS}; no per-row border so stripes stay intact. */
export const PROJECT_ENTITY_LIST_ROW_CLASS =
  'hover:bg-muted/50 group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors';

/** Minimum card track width (px) — aligned with drive tile grid pattern. */
export const PROJECT_ENTITY_CARD_MIN_WIDTH_PX = 280;

/** @deprecated Use {@link NAVIGABLE_ENTITY_CARD_GRID_CLASS} from `@/components/shared`. */
export { NAVIGABLE_ENTITY_CARD_GRID_CLASS as PROJECT_PRODUCTS_CARD_GRID_CLASS } from '@/components/shared/navigable-entity-card.constants';

/** Section headings (Extensions) — below project name in app header. */
export const PROJECT_SECTION_TITLE_CLASS =
  'text-base font-semibold tracking-tight text-foreground/90';
