import {
  AI_MODEL_CATALOG_SYNC_CRON_ENV,
  AI_MODEL_CATALOG_SYNC_DEFAULT_CRON,
  AI_MODEL_CATALOG_SYNC_ENABLED_ENV,
} from '../ai-platform/providers/ai-provider.constants';
import { SCHEDULER_JOB_NAMES } from './scheduler-lease.constants';
import {
  platformCronEntry,
  SCHEDULER_JOB_GROUP,
  SCHEDULER_JOB_RISK,
  SCHEDULER_ROSTER_INTENT,
  type SchedulerJobCatalogEntry,
} from './scheduler-job-catalog.types';

/**
 * AI Platform cron rows.
 *
 * Kept beside the shared catalog rather than inside it so scheduler entries
 * stay within the file budget and the AI Platform imports live in one place.
 */
export const SCHEDULER_AI_CRON_CATALOG: readonly SchedulerJobCatalogEntry[] = [
  platformCronEntry({
    jobName: SCHEDULER_JOB_NAMES.aiModelCatalogSync,
    title: 'AI model catalog sync',
    description:
      'Refreshes provider model catalogs every 6 hours. Discovery only — a new model never becomes ACTIVE without an admin decision.',
    ownerModule: 'AI Platform',
    group: SCHEDULER_JOB_GROUP.ai,
    defaultExpression: AI_MODEL_CATALOG_SYNC_DEFAULT_CRON,
    enabledEnvKey: AI_MODEL_CATALOG_SYNC_ENABLED_ENV,
    cronEnvKey: AI_MODEL_CATALOG_SYNC_CRON_ENV,
    risk: SCHEDULER_JOB_RISK.low,
    rosterIntent: SCHEDULER_ROSTER_INTENT.off,
  }),
];
