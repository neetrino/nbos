/** Two cards side by side; a third column needs a sheet that covers the deal form. */
export const CODE_PRODUCT_TYPE_CARD_GRID_CLASS =
  'grid grid-cols-1 content-start gap-2 sm:grid-cols-2';

/** Cap at 32rem so the picker stays a field popover, not a second sheet. */
export const CODE_PRODUCT_TYPE_POPOVER_CLASS =
  'w-[min(32rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] gap-2 p-3';

/** Sit the card grid under the Type field, not flush to one edge. */
export const CODE_PRODUCT_TYPE_POPOVER_ALIGN = 'center' as const;

export const CODE_PRODUCT_TYPE_LIST_CLASS = 'max-h-[min(28rem,60vh)] overflow-y-auto pr-0.5';

export const CODE_PRODUCT_TYPE_CHEVRON_SIZE_PX = 16;

export const CODE_PRODUCT_TYPE_CLEAR_ICON_SIZE_PX = 16;
