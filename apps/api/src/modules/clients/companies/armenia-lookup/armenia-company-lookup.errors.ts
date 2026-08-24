import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ARMENIA_COMPANY_LOOKUP_ERROR } from './armenia-company-lookup.constants';

export function lookupQueryInvalid(): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    code: ARMENIA_COMPANY_LOOKUP_ERROR.QUERY_INVALID,
    message: 'Enter an 8-digit Armenian TIN or a company name.',
  });
}

export function lookupUnavailable(message: string): ServiceUnavailableException {
  return new ServiceUnavailableException({
    statusCode: 503,
    code: ARMENIA_COMPANY_LOOKUP_ERROR.UNAVAILABLE,
    message,
  });
}
