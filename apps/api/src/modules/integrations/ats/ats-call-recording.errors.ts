export class AtsRecordingTransientError extends Error {
  readonly retryable = true as const;

  constructor(message: string) {
    super(message);
    this.name = 'AtsRecordingTransientError';
  }
}

export class AtsRecordingPermanentError extends Error {
  readonly retryable = false as const;

  constructor(message: string) {
    super(message);
    this.name = 'AtsRecordingPermanentError';
  }
}

export function isAtsRecordingPermanentError(error: unknown): boolean {
  return error instanceof AtsRecordingPermanentError;
}

export function isAtsRecordingTransientError(error: unknown): boolean {
  return error instanceof AtsRecordingTransientError;
}
