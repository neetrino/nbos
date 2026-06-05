export {
  REPORTS_MODULE_VISIT_CONFIG,
  REPORTS_SECTION_DEFAULTS,
  isReportsHeaderContextPath,
  isReportsModulePath,
  isReportsSectionPath,
  resolveReportsSectionId,
  type ReportsSectionId,
} from './reports-visit-config';

import { readModuleSectionHref } from './module-last-visit-storage';
import type { ReportsSectionId } from './reports-visit-config';

export function readReportsSectionHref(sectionId: ReportsSectionId): string {
  return readModuleSectionHref('reports', sectionId);
}

export { writeModuleLastVisitFromPathname } from './module-last-visit-storage';
