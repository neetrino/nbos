/**
 * Rotate Lucide ChevronDown on open Select / DropdownMenu / Popover triggers
 * (Base UI sets {@code data-popup-open} on the trigger).
 */
export const DROPDOWN_TRIGGER_CHEVRON_ROTATE_CLASS = [
  '[&_svg.lucide-chevron-down]:transition-transform [&_svg.lucide-chevron-down]:duration-200',
  'data-[popup-open]:[&_svg.lucide-chevron-down]:rotate-180',
  'aria-expanded:[&_svg.lucide-chevron-down]:rotate-180',
].join(' ');

/** Class for a ChevronDown that itself receives open state (e.g. Select.Icon). */
export const DROPDOWN_CHEVRON_ICON_CLASS =
  'transition-transform duration-200 data-[popup-open]:rotate-180';
