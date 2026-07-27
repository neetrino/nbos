/**
 * CLI: dry-run or repair NotificationInboxState.
 *
 *   pnpm notifications:inbox:check
 *   pnpm notifications:inbox:repair
 *   pnpm notifications:inbox:check -- --employee-id=... --batch-size=100 --limit=500
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NotificationInboxReconcileService } from '../src/modules/notifications/notification-inbox-reconcile.service';
import { evaluateInboxStateReadiness } from '../src/modules/notifications/notification-inbox-readiness';
import {
  isNotificationInboxStateReconcileEnabled,
  isNotificationInboxStateWriteEnabled,
  resolveInboxReadMaxAbsoluteDrift,
  resolveInboxReadMaxDriftedRows,
  resolveInboxReadMaxMissingRows,
} from '../src/modules/notifications/notification-inbox-state.flags';

function parseArgs(argv: string[]) {
  const out: {
    mode: 'dry-run' | 'repair';
    batchSize?: number;
    limit?: number;
    employeeId?: string;
  } = {
    mode:
      argv.includes('--repair') || process.env.INBOX_CLI_MODE === 'repair' ? 'repair' : 'dry-run',
  };
  for (const arg of argv) {
    if (arg.startsWith('--batch-size=')) out.batchSize = Number(arg.slice('--batch-size='.length));
    if (arg.startsWith('--limit=')) out.limit = Number(arg.slice('--limit='.length));
    if (arg.startsWith('--employee-id=')) out.employeeId = arg.slice('--employee-id='.length);
    if (arg === '--dry-run') out.mode = 'dry-run';
    if (arg === '--repair') out.mode = 'repair';
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  process.env.PROCESS_ROLE = process.env.PROCESS_ROLE ?? 'api';
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const reconcile = app.get(NotificationInboxReconcileService);
    const report = await reconcile.reconcileAll({
      mode: args.mode,
      batchSize: args.batchSize,
      limit: args.limit,
      employeeId: args.employeeId,
      publish: args.mode === 'repair',
      force: true,
    });

    console.log(JSON.stringify(report, null, 2));

    if (args.mode === 'dry-run') {
      const readiness = evaluateInboxStateReadiness({
        report,
        writeEnabled: isNotificationInboxStateWriteEnabled(),
        reconcileEnabled: isNotificationInboxStateReconcileEnabled(),
        lastReconciliationSucceeded: true,
        maxDriftedRows: resolveInboxReadMaxDriftedRows(),
        maxMissingRows: resolveInboxReadMaxMissingRows(),
        maxAbsoluteDrift: resolveInboxReadMaxAbsoluteDrift(),
      });

      console.log(
        JSON.stringify({ readiness: readiness.decision, reasons: readiness.reasons }, null, 2),
      );
      process.exitCode = readiness.decision === 'READY' ? 0 : 2;
    }
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
