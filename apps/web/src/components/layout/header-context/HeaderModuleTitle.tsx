import type { ReactNode } from 'react';
import {
  HEADER_MODULE_TITLE_DIVIDER,
  HEADER_MODULE_TITLE_LABEL,
  HEADER_MODULE_TITLE_WRAP,
} from './header-module-title-constants';

export interface HeaderModuleTitleProps {
  children: string;
  /** Module glyph — shown on mobile to the left of the title. */
  leadingIcon?: ReactNode;
}

/** Module name in the top bar — left, vertically centered, divider before zone tabs. */
export function HeaderModuleTitle({ children, leadingIcon }: HeaderModuleTitleProps) {
  return (
    <div className={HEADER_MODULE_TITLE_WRAP}>
      {leadingIcon}
      <span className={HEADER_MODULE_TITLE_LABEL}>{children}</span>
      <span className={HEADER_MODULE_TITLE_DIVIDER} aria-hidden />
    </div>
  );
}
