import {
  BadRequestException,
  ConflictException,
  HttpException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { WHATSAPP_ERROR, type WhatsAppErrorCode } from './whatsapp-gateway.constants';

export class WhatsAppGatewayHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'WhatsAppGatewayHttpError';
  }
}

export function throwWhatsAppDomainError(
  status: 400 | 401 | 403 | 409 | 503,
  code: WhatsAppErrorCode | string,
  message: string,
  extras?: Record<string, unknown>,
): never {
  const body = {
    statusCode: status,
    code,
    message,
    ...extras,
  };
  if (status === 409) {
    throw new ConflictException(body);
  }
  if (status === 401 || status === 403) {
    throw new UnauthorizedException(body);
  }
  if (status === 503) {
    throw new ServiceUnavailableException(body);
  }
  throw new BadRequestException(body);
}

export function mapGatewayErrorToDomain(error: WhatsAppGatewayHttpError): never {
  const code = error.code;
  if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' || code === 'TOKEN_REVOKED') {
    throwWhatsAppDomainError(401, WHATSAPP_ERROR.GATEWAY_UNAUTHORIZED, error.message);
  }
  if (code === 'WHATSAPP_NOT_CONNECTED') {
    throwWhatsAppDomainError(409, WHATSAPP_ERROR.NOT_CONNECTED, error.message);
  }
  if (code === 'WAHA_UNAVAILABLE') {
    throwWhatsAppDomainError(503, WHATSAPP_ERROR.GATEWAY_UNAVAILABLE, error.message);
  }
  if (code === 'GROUP_CREATE_OUTCOME_UNKNOWN') {
    throwWhatsAppDomainError(503, WHATSAPP_ERROR.PRODUCT_GROUP_OUTCOME_UNKNOWN, error.message);
  }
  if (code === 'GROUP_NOT_FOUND' || code === 'INVALID_GROUP_ID') {
    throwWhatsAppDomainError(400, WHATSAPP_ERROR.INVALID_GROUP_ID, error.message);
  }
  if (error.status >= 500) {
    throwWhatsAppDomainError(503, WHATSAPP_ERROR.GATEWAY_UNAVAILABLE, error.message);
  }
  throwWhatsAppDomainError(400, code || WHATSAPP_ERROR.PRODUCT_GROUP_CREATE_FAILED, error.message);
}

export function isRetryableGatewayError(code: string | null | undefined): boolean {
  if (!code) return false;
  return (
    code === 'WAHA_UNAVAILABLE' ||
    code === 'RATE_LIMITED' ||
    code === 'HTTP_502' ||
    code === 'HTTP_503' ||
    code === 'HTTP_504' ||
    code === WHATSAPP_ERROR.GATEWAY_UNAVAILABLE
  );
}

const UNREACHABLE_GATEWAY_CODES = new Set<string>([
  WHATSAPP_ERROR.GATEWAY_NOT_CONFIGURED,
  WHATSAPP_ERROR.GATEWAY_UNAVAILABLE,
  WHATSAPP_ERROR.NOT_CONNECTED,
  'WAHA_UNAVAILABLE',
]);

function readExceptionCode(error: unknown): string | null {
  if (error instanceof WhatsAppGatewayHttpError) return error.code;
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'object' && response && 'code' in response) {
      const code = (response as { code?: unknown }).code;
      return typeof code === 'string' ? code : null;
    }
  }
  return null;
}

/** True when Gateway/WAHA cannot be reached (bind may still persist an ID). */
export function isUnreachableWhatsAppGatewayError(error: unknown): boolean {
  const code = readExceptionCode(error);
  if (code && UNREACHABLE_GATEWAY_CODES.has(code)) return true;
  if (error instanceof ServiceUnavailableException) return true;
  return false;
}

export function isUnknownCreateOutcome(code: string | null | undefined): boolean {
  return (
    code === 'GROUP_CREATE_OUTCOME_UNKNOWN' || code === WHATSAPP_ERROR.PRODUCT_GROUP_OUTCOME_UNKNOWN
  );
}
