import { BadRequestException } from '@nestjs/common';

export interface MarketingDashboardPeriodRange {
  dateFrom: Date;
  dateTo: Date;
}

/**
 * Parses optional dashboard query params. Both dates required when either is present.
 */
export function resolveMarketingDashboardPeriodQuery(params: {
  dateFrom?: string;
  dateTo?: string;
}): MarketingDashboardPeriodRange | undefined {
  const { dateFrom, dateTo } = params;
  if (!dateFrom && !dateTo) {
    return undefined;
  }
  if (!dateFrom || !dateTo) {
    throw new BadRequestException(
      'dateFrom and dateTo must both be provided for a marketing dashboard period filter.',
    );
  }
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new BadRequestException('Invalid dateFrom or dateTo.');
  }
  if (from.getTime() > to.getTime()) {
    throw new BadRequestException('dateFrom must be before or equal to dateTo.');
  }
  return { dateFrom: from, dateTo: to };
}
