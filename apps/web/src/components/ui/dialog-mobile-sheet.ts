/** Mobile Dialog chrome — same bottom sheet as Search / Menu. */
export const DIALOG_MOBILE_SHEET_POPUP_CLASS = [
  'max-md:top-auto max-md:right-0 max-md:bottom-0 max-md:left-0',
  'max-md:flex max-md:min-h-0 max-md:flex-col',
  'max-md:max-h-[min(88dvh,calc(100dvh-0.5rem))]',
  'max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0',
  'max-md:gap-0 max-md:overflow-hidden max-md:border-x-0 max-md:border-t max-md:p-0',
  'max-md:rounded-t-3xl max-md:rounded-b-none max-md:shadow-xl',
  'max-md:data-open:slide-in-from-bottom max-md:data-closed:slide-out-to-bottom',
].join(' ');

export const DIALOG_MOBILE_SHEET_BODY_CLASS = [
  'md:contents',
  'max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col max-md:gap-3',
  'max-md:overflow-y-auto max-md:overscroll-y-contain',
  'max-md:px-4 max-md:pt-3 max-md:pb-5',
].join(' ');

export const DIALOG_MOBILE_CLOSE_BUTTON_CLASS = 'absolute top-3 right-3 max-md:hidden';

export const DIALOG_MOBILE_FOOTER_CLASS = [
  'max-md:bg-transparent max-md:border-t-0 max-md:mx-0 max-md:mb-0',
  'max-md:rounded-none max-md:p-0 max-md:pt-2',
].join(' ');
