import {
  PrismaClient,
  createPrismaClient,
  readPrismaClientDiagnostics,
  withQueryMetrics,
  calculateConnectionBudget,
  formatWorkerDbCapacityDiagnostic,
  resolvePoolMaxForRole,
  type DbPoolRole,
} from '@nbos/database';
import { ConfigService } from '@nestjs/config';
import { Global, Module, OnModuleDestroy, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { resolveProcessRole } from './runtime/process-role';
import { resolveAllBullmqConcurrency } from './runtime/bullmq-concurrency';

export const PRISMA_TOKEN = 'PRISMA_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_TOKEN,
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) {
          throw new Error('DATABASE_URL is not configured');
        }
        // Ensure Direct URL is never used at runtime via ConfigService alias mistakes.
        const direct = config.get<string>('DIRECT_URL');
        if (direct && url === direct && process.env.NODE_ENV === 'production') {
          throw new Error(
            'DATABASE_URL must be the Neon pooled endpoint; DIRECT_URL is for migrations only',
          );
        }

        const role = resolveProcessRole() as DbPoolRole;
        const base = createPrismaClient({
          databaseUrl: url,
          role,
          env: process.env,
        });
        const diag = readPrismaClientDiagnostics(base);
        const instrumented = withQueryMetrics(base, role, process.env);
        if (diag) {
          Object.defineProperty(instrumented, '__nbosDbDiagnostics', {
            value: diag,
            enumerable: false,
          });
        }
        return instrumented;
      },
      inject: [ConfigService],
    },
  ],
  exports: [PRISMA_TOKEN],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async onModuleInit(): Promise<void> {
    await this.prisma.$connect();
    const diag = readPrismaClientDiagnostics(this.prisma);
    const role = diag?.role ?? resolveProcessRole();
    this.logger.log(
      `Prisma runtime initialized processRole=${role} clientInstances=${diag?.clientInstances ?? 1} poolMax=${diag?.poolMax ?? '?'}`,
    );
    if (diag?.safeSummary) {
      this.logger.log(`Prisma datasource ${diag.safeSummary}`);
    }

    const budget = calculateConnectionBudget();
    for (const line of budget.lines) {
      this.logger.log(line);
    }

    if (role === 'worker' || role === 'all') {
      const concurrency = resolveAllBullmqConcurrency();
      const totalJobs =
        concurrency.mail + concurrency.whatsapp + concurrency.reports + concurrency.driveZip;
      const poolMax = diag?.poolMax ?? resolvePoolMaxForRole('worker');
      this.logger.log(
        formatWorkerDbCapacityDiagnostic({
          role: 'worker',
          poolMax,
          configuredJobConcurrency: totalJobs,
        }),
      );
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
