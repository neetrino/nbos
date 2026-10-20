import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { actorContextFromUserId, FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { financeClientServiceAccessFromUser } from '../finance/finance-module-access';
import { CheckRegistryAllDto } from './dto/check-registry-all.dto';
import { DomainRegistryBulkService } from './registry/domain-registry-bulk.service';
import type { DomainRegistryBulkPageResult } from './registry/domain-registry-bulk.summary';

/** Bulk registry check. Per-card Check stays on `ClientServicesController`. */
@ApiTags('Client services')
@ApiBearerAuth()
@Controller('client-services')
export class ClientServicesRegistryController {
  constructor(private readonly bulkRegistry: DomainRegistryBulkService) {}

  @Post('actions/check-registry-all')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Check one time-boxed page of all domain cards via WHOIS/RDAP',
    description:
      'Call again with nextCursor until done. Dates follow the registry, including earlier days. Only the per-card Check creates a renewal invoice.',
  })
  async checkRegistryAll(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CheckRegistryAllDto,
  ): Promise<DomainRegistryBulkPageResult> {
    return this.bulkRegistry.checkPage({
      cursor: body.cursor ?? null,
      actor: actorContextFromUserId(user.id),
      access: financeClientServiceAccessFromUser(user),
    });
  }
}
