import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FINANCE_REPORT_DEFINITIONS,
  type FinanceReportDefinitionId,
} from './finance-report-definitions';

@Injectable()
export class FinanceReportsService {
  getDefinitions() {
    return {
      items: FINANCE_REPORT_DEFINITIONS,
      meta: {
        count: FINANCE_REPORT_DEFINITIONS.length,
        scope: 'Phase 3 Finance-owned report definitions v1',
        phase6Boundary:
          'Global Reports / Analytics catalog, scheduling, BI presentation, accrual depth and period close stay in Phase 6.',
      },
    };
  }

  getDefinition(id: string) {
    const definition = FINANCE_REPORT_DEFINITIONS.find(
      (item) => item.id === (id as FinanceReportDefinitionId),
    );
    if (!definition) throw new NotFoundException('Finance report definition not found');
    return definition;
  }
}
