import {
  HEADER_MODULE_TITLE_DIVIDER,
  HEADER_MODULE_TITLE_LABEL,
  HEADER_MODULE_TITLE_WRAP,
} from './header-module-title-constants';

export interface HeaderModuleTitleProps {
  children: string;
  /** Divider before zone tabs on the same row. Hide when tabs stack below. */
  showDivider?: boolean;
}

/** Module name in the top bar — left, vertically centered, divider before zone tabs. */
export function HeaderModuleTitle({ children, showDivider = true }: HeaderModuleTitleProps) {
  return (
    <div className={HEADER_MODULE_TITLE_WRAP}>
      <span className={HEADER_MODULE_TITLE_LABEL}>{children}</span>
      {showDivider ? <span className={HEADER_MODULE_TITLE_DIVIDER} aria-hidden /> : null}
    </div>
  );
}
