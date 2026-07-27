import { resolveDbPoolRuntimeConfig, resolvePoolMaxForRole, type DbPoolRole } from './db-pool-env';

export type ConnectionBudgetBreakdown = {
  api: { replicas: number; poolMax: number; total: number };
  worker: { replicas: number; poolMax: number; total: number };
  scheduler: { replicas: number; poolMax: number; total: number };
  reserved: number;
  plannedTotal: number;
  budget: number | null;
  status: 'OK' | 'OVER_BUDGET' | 'BUDGET_UNSET';
  lines: string[];
};

export function calculateConnectionBudget(
  env: NodeJS.ProcessEnv = process.env,
): ConnectionBudgetBreakdown {
  const cfg = resolveDbPoolRuntimeConfig(env);
  const apiMax = resolvePoolMaxForRole('api', env);
  const workerMax = resolvePoolMaxForRole('worker', env);
  const schedulerMax = resolvePoolMaxForRole('scheduler', env);

  const api = {
    replicas: cfg.apiReplicaCount,
    poolMax: apiMax,
    total: cfg.apiReplicaCount * apiMax,
  };
  const worker = {
    replicas: cfg.workerReplicaCount,
    poolMax: workerMax,
    total: cfg.workerReplicaCount * workerMax,
  };
  const scheduler = {
    replicas: cfg.schedulerReplicaCount,
    poolMax: schedulerMax,
    total: cfg.schedulerReplicaCount * schedulerMax,
  };
  const plannedTotal = api.total + worker.total + scheduler.total + cfg.reservedConnections;

  let status: ConnectionBudgetBreakdown['status'] = 'OK';
  if (cfg.totalConnectionBudget == null) {
    status = 'BUDGET_UNSET';
  } else if (plannedTotal > cfg.totalConnectionBudget) {
    status = 'OVER_BUDGET';
  }

  const lines = [
    'Database connection budget:',
    `API: ${api.replicas} × ${api.poolMax} = ${api.total}`,
    `Worker: ${worker.replicas} × ${worker.poolMax} = ${worker.total}`,
    `Scheduler: ${scheduler.replicas} × ${scheduler.poolMax} = ${scheduler.total}`,
    `Reserved: ${cfg.reservedConnections}`,
    `Total planned: ${plannedTotal}`,
    `Budget: ${cfg.totalConnectionBudget ?? '(unset)'}`,
    `Status: ${status}`,
  ];

  return {
    api,
    worker,
    scheduler,
    reserved: cfg.reservedConnections,
    plannedTotal,
    budget: cfg.totalConnectionBudget,
    status,
    lines,
  };
}

/**
 * Fail-fast for production when budget is missing or exceeded.
 * Non-production: OVER_BUDGET throws; BUDGET_UNSET is allowed (local/dev).
 */
export function assertConnectionBudgetForStartup(
  env: NodeJS.ProcessEnv = process.env,
): ConnectionBudgetBreakdown {
  const breakdown = calculateConnectionBudget(env);
  const isProduction = env.NODE_ENV === 'production';

  if (breakdown.status === 'OVER_BUDGET') {
    throw new Error(
      `Database connection budget exceeded: planned=${breakdown.plannedTotal} budget=${breakdown.budget}.\n${breakdown.lines.join('\n')}`,
    );
  }

  if (isProduction && breakdown.status === 'BUDGET_UNSET') {
    throw new Error(
      'DB_TOTAL_CONNECTION_BUDGET is required in production (set to current Neon plan connection limit).\n' +
        breakdown.lines.join('\n'),
    );
  }

  return breakdown;
}

export function formatWorkerDbCapacityDiagnostic(input: {
  role: DbPoolRole;
  poolMax: number;
  configuredJobConcurrency: number;
}): string {
  const ratio = input.configuredJobConcurrency / Math.max(1, input.poolMax);
  let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (ratio > 3) risk = 'HIGH';
  else if (ratio > 1.5) risk = 'MEDIUM';
  return (
    `Worker DB capacity:\n` +
    `poolMax=${input.poolMax}\n` +
    `configuredJobConcurrency=${input.configuredJobConcurrency}\n` +
    `risk=${risk}`
  );
}
