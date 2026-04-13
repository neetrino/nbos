import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PrismaPg } from '@prisma/adapter-pg';

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

        const adapter = new PrismaPg({ connectionString: url });
        return new PrismaClient({ adapter });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PRISMA_TOKEN],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
