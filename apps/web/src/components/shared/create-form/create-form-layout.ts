/** Shared create-dialog and compact form row tokens. */

export const CREATE_FORM_DIALOG_CONTENT_CLASS =
  'bg-card max-h-[90vh] overflow-y-auto sm:max-w-[36rem]';

export const CREATE_FORM_BODY_CLASS = 'flex flex-col gap-3';

/** Title + compact mode switch grouped together; `pr-8` clears the dialog close button. */
export const CREATE_FORM_TITLE_ROW_CLASS = 'flex items-center gap-3 pr-8';

/** Equal-width rows — 1 col mobile, 2 col sm+. */
export const FORM_FIELD_ROW_2_CLASS = 'grid grid-cols-1 gap-3 sm:grid-cols-2';

/** Domain name wider than amount — 1 col mobile, 2:1 sm+. */
export const FORM_FIELD_ROW_WIDE_START_CLASS =
  'grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]';

/** Equal-width rows — 1 col mobile, 3 col sm+. */
export const FORM_FIELD_ROW_3_CLASS = 'grid grid-cols-1 gap-3 sm:grid-cols-3';

export const FORM_FIELD_CELL_CLASS = 'min-w-0 w-full';
