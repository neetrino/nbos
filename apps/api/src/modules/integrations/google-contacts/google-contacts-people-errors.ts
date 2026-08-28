interface GoogleApiErrorShape {
  code?: number | string;
  response?: { status?: number };
  message?: string;
}

function readStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const shaped = error as GoogleApiErrorShape;
  if (typeof shaped.response?.status === 'number') {
    return shaped.response.status;
  }
  const code = shaped.code;
  if (typeof code === 'number') return code;
  if (typeof code === 'string' && /^\d+$/.test(code)) {
    return Number(code);
  }
  return undefined;
}

export function isGooglePeopleNotFound(error: unknown): boolean {
  return readStatus(error) === 404;
}

export function isGooglePeopleEtagConflict(error: unknown): boolean {
  const status = readStatus(error);
  if (status === 409 || status === 412) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('etag') || message.includes('precondition');
  }
  return false;
}
