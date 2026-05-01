export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  statusCode?: number;
  code?: string;
  message?: string | Record<string, unknown>;
  errors?: ApiFieldError[];
  details?: Record<string, unknown>;
}

const STAGE_GATE_ERROR_CODES = new Set([
  'ATTRIBUTION_GATE_VALIDATION',
  'ATTRIBUTION_IMMUTABLE',
  'STAGE_GATE_VALIDATION',
  'EXTENSION_STAGE_GATE_VALIDATION',
]);

export class ApiError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly errors: ApiFieldError[];
  readonly details: Record<string, unknown>;

  constructor(message: string, payload: ApiErrorPayload = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = payload.statusCode;
    this.code = payload.code;
    this.errors = payload.errors ?? [];
    this.details = payload.details ?? {};
  }
}

export function toApiError(payload: unknown, fallbackMessage: string): ApiError {
  const parsed = parsePayload(payload);
  const rawMessage = parsed.message ?? fallbackMessage;
  const message = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
  return new ApiError(message, parsed);
}

export function isStageGateApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    Boolean(error.code && STAGE_GATE_ERROR_CODES.has(error.code)) &&
    error.errors.length > 0
  );
}

export function isBusinessTransitionApiError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === 'BUSINESS_TRANSITION_UNAVAILABLE';
}

/** User-visible message from axios-wrapped `ApiError`; otherwise `fallback` (e.g. generic connection copy). */
export function getApiErrorMessage(caught: unknown, fallback: string): string {
  return caught instanceof ApiError ? caught.message : fallback;
}

function parsePayload(payload: unknown): ApiErrorPayload {
  if (!isRecord(payload)) return {};
  const structuredMessage = isRecord(payload.message) ? parsePayload(payload.message) : {};
  const directMessage = typeof payload.message === 'string' ? payload.message : undefined;

  return {
    statusCode:
      typeof payload.statusCode === 'number' ? payload.statusCode : structuredMessage.statusCode,
    code: typeof payload.code === 'string' ? payload.code : structuredMessage.code,
    message: directMessage ?? structuredMessage.message,
    errors: parseFieldErrors(payload.errors) ?? structuredMessage.errors,
    details: payload,
  };
}

function parseFieldErrors(errors: unknown): ApiFieldError[] | undefined {
  if (!Array.isArray(errors)) return undefined;
  return errors.filter(isFieldError);
}

function isFieldError(error: unknown): error is ApiFieldError {
  return (
    isRecord(error) &&
    typeof error.field === 'string' &&
    typeof error.message === 'string' &&
    error.field.trim().length > 0 &&
    error.message.trim().length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
