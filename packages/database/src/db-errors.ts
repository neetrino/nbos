export type DbErrorCode =
  | 'DB_CONNECT_FAILED'
  | 'DB_POOL_TIMEOUT'
  | 'DB_STATEMENT_TIMEOUT'
  | 'DB_TRANSACTION_CONFLICT'
  | 'DB_UNIQUE_CONSTRAINT'
  | 'DB_UNKNOWN';

export type ClassifiedDbError = {
  code: DbErrorCode;
  httpStatus: number;
  clientMessage: string;
};

/**
 * Map driver / Prisma errors to stable codes without leaking internals to clients.
 */
export function classifyDatabaseError(err: unknown): ClassifiedDbError | null {
  if (!err || typeof err !== 'object') return null;
  const message = 'message' in err && typeof err.message === 'string' ? err.message : '';
  const code = 'code' in err && typeof err.code === 'string' ? err.code : '';
  const name = 'name' in err && typeof err.name === 'string' ? err.name : '';

  const lower = message.toLowerCase();

  if (
    code === 'P2024' ||
    lower.includes('timeout exceeded when trying to connect') ||
    lower.includes('connection pool') ||
    lower.includes('too many clients') ||
    lower.includes('remaining connection slots')
  ) {
    return {
      code: 'DB_POOL_TIMEOUT',
      httpStatus: 503,
      clientMessage: 'Database temporarily unavailable',
    };
  }

  if (
    code === '57014' ||
    lower.includes('statement timeout') ||
    lower.includes('canceling statement due to statement timeout')
  ) {
    return {
      code: 'DB_STATEMENT_TIMEOUT',
      httpStatus: 504,
      clientMessage: 'Database query timed out',
    };
  }

  if (code === 'P2034' || code === '40001' || lower.includes('could not serialize')) {
    return {
      code: 'DB_TRANSACTION_CONFLICT',
      httpStatus: 409,
      clientMessage: 'Please retry the request',
    };
  }

  if (code === 'P2002' || code === '23505') {
    return {
      code: 'DB_UNIQUE_CONSTRAINT',
      httpStatus: 409,
      clientMessage: 'Conflict',
    };
  }

  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'P1001' ||
    lower.includes("can't reach database") ||
    lower.includes('connection terminated') ||
    name === 'PrismaClientInitializationError'
  ) {
    return {
      code: 'DB_CONNECT_FAILED',
      httpStatus: 503,
      clientMessage: 'Database temporarily unavailable',
    };
  }

  if (name.includes('Prisma') || code.startsWith('P') || code.startsWith('23')) {
    return {
      code: 'DB_UNKNOWN',
      httpStatus: 500,
      clientMessage: 'Internal server error',
    };
  }

  return null;
}
