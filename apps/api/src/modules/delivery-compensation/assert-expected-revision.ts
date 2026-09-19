import { ConflictException } from '@nestjs/common';

export function throwConfigurationConflict(): never {
  throw new ConflictException({
    statusCode: 409,
    code: 'CONFIGURATION_CONFLICT',
    message: 'This configuration changed. Reload and try again.',
  });
}

export function assertExpectedRevision(
  configuration: {
    initialRevisionId: string | null;
    currentRevision: { sequence: number } | null;
    draftVersion: number;
  },
  expected?: number,
): void {
  const current = configuration.currentRevision?.sequence ?? configuration.draftVersion;
  if (configuration.initialRevisionId && expected === undefined) {
    throwConfigurationConflict();
  }
  if (expected !== undefined && expected !== current) {
    throwConfigurationConflict();
  }
}
