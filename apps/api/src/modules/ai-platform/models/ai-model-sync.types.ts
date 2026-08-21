import { AiProviderHttpError } from '../providers/ai-provider-http';
import type { AiModelView } from './ai-model.mapper';

export type ModelSyncActor = { kind: 'employee'; employeeId: string } | { kind: 'system' };

export interface ModelSyncResult {
  connectionId: string;
  created: number;
  refreshed: number;
  disappeared: number;
  models: AiModelView[];
}

export type ModelSyncConnectionOutcome =
  | { connectionId: string; ok: true; result: ModelSyncResult }
  | { connectionId: string; ok: false; errorCode: string };

export function toModelSyncErrorCode(error: unknown): string {
  if (error instanceof AiProviderHttpError) {
    return error.errorCode;
  }
  return 'SYNC_FAILED';
}
