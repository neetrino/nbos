import { BadRequestException } from '@nestjs/common';
import { CatalogContentValidationError, CatalogFinancialMassAssignmentError } from '@nbos/shared';

export function mapCatalogWriteError(error: unknown): never {
  if (error instanceof CatalogFinancialMassAssignmentError) {
    throw new BadRequestException({
      code: error.code,
      message: 'Financial fields are not accepted on catalog content writes',
    });
  }
  if (error instanceof CatalogContentValidationError) {
    throw new BadRequestException({
      code: error.code,
      message: error.message,
    });
  }
  throw error;
}
