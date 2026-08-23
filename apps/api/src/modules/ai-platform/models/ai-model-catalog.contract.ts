import { actorContextFromMachine, type ActorContext } from '@nbos/shared';
import {
  AI_MODEL_CATALOG_SYNC_CRON_ENV,
  AI_MODEL_CATALOG_SYNC_DEFAULT_CRON,
  AI_MODEL_CATALOG_SYNC_ENABLED_ENV,
  AI_MODEL_CATALOG_SYNC_JOB_NAME,
} from '../providers/ai-provider.constants';

export const AI_MODEL_CATALOG_SYNC_ACTOR_ID = 'ai-model-catalog-sync';

/**
 * Typed scheduled catalog sync contract. Nest SchedulerService catalog
 * registration stays deferred (that file is already over the size limit).
 * Chat 7 binds `AiModelSyncService.runScheduledCatalogSync` with
 * `rosterIntent=off`.
 */
export const AI_MODEL_CATALOG_SYNC_CONTRACT = {
  jobName: AI_MODEL_CATALOG_SYNC_JOB_NAME,
  enabledEnvKey: AI_MODEL_CATALOG_SYNC_ENABLED_ENV,
  cronEnvKey: AI_MODEL_CATALOG_SYNC_CRON_ENV,
  defaultExpression: AI_MODEL_CATALOG_SYNC_DEFAULT_CRON,
  runnerMethod: 'runScheduledCatalogSync',
  actorId: AI_MODEL_CATALOG_SYNC_ACTOR_ID,
  actorType: 'SYSTEM',
} as const;

export function catalogSyncSystemActor(): ActorContext {
  return actorContextFromMachine(
    { id: AI_MODEL_CATALOG_SYNC_ACTOR_ID, type: 'SYSTEM' },
    { channel: { source: 'scheduler' } },
  );
}
