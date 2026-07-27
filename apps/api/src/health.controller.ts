import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaClient } from '@nbos/database';
import { Public } from './common/decorators';
import { PRISMA_TOKEN } from './database.module';
import { checkPrismaReadiness } from './database/db-readiness';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Liveness check (no DB dependency)' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'nbos-api',
      version: '0.1.0',
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness — includes cached DB SELECT 1' })
  async ready() {
    const db = await checkPrismaReadiness(this.prisma);
    if (!db.ok) {
      throw new ServiceUnavailableException({
        ready: false,
        reason: 'database_unavailable',
      });
    }
    return {
      ready: true,
      database: true,
      cached: db.cached,
      timestamp: new Date().toISOString(),
    };
  }
}
