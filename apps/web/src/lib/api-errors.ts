export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  statusCode?: number;
  code?: string;
  message?: string | Record<string, unknown>;
  errors?: ApiFieldError[];
}

const STAGE_GATE_ERROR_CODES = new Set(['ATTRIBUTION_GATE_VALIDATION', 'STAGE_GATE_VALIDATION']);

export class ApiError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly errors: ApiFieldError[];

  constructor(message: string, payload: ApiErrorPayload = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = payload.statusCode;
    this.code = payload.code;
    this.errors = payload.errors ?? [];
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

function parsePayload(payload: unknown): ApiErrorPayload {
  if (!isRecord(payload)) return {};
  return {
    statusCode: typeof payload.statusCode === 'number' ? payload.statusCode : undefined,
    code: typeof payload.code === 'string' ? payload.code : undefined,
    message: parseMessage(payload.message),
    errors: parseFieldErrors(payload.errors),
  };
}

function parseMessage(message: unknown): ApiErrorPayload['message'] {
  if (typeof message === 'string') return message;
  if (isRecord(message)) return message;
  return undefined;
}

function parseFieldErrors(errors: unknown): ApiFieldError[] {
  if (!Array.isArray(errors)) return [];
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
