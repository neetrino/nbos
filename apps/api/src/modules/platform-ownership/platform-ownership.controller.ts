import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@nbos/database';
import { CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { assertCredentialStepUpPassword } from '../credentials/credential-step-up';
import { PlatformOwnershipService } from './platform-ownership.service';

@ApiTags('Platform Ownership')
@ApiBearerAuth()
@Controller('platform/ownership')
export class PlatformOwnershipController {
  constructor(
    private readonly ownership: PlatformOwnershipService,
    private readonly audit: AuditService,
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Current platform owner identity (Founder only)' })
  async getOwnership(@CurrentUser() user: CurrentUserPayload) {
    await this.ownership.assertPlatformOwner(user.id);
    const row = await this.ownership.loadOwnership();
    return {
      ownerEmployeeId: row?.ownerEmployeeId ?? null,
      integrityOk: (await this.ownership.evaluate(user.id)).ok,
    };
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer platform ownership (Founder, step-up required)' })
  async transfer(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { targetEmployeeId?: string; confirm?: string; stepUpPassword?: string },
  ) {
    await assertCredentialStepUpPassword(
      this.prisma,
      this.audit,
      user.id,
      body.stepUpPassword,
      'ownership_transfer',
    );
    return this.ownership.transfer({
      actorId: user.id,
      targetEmployeeId: body.targetEmployeeId?.trim() ?? '',
      confirm: body.confirm?.trim() ?? '',
      stepUpVerified: true,
    });
  }
}
