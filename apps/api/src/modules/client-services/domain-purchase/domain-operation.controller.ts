import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FINANCE_CLIENT_SERVICES_MODULE } from '@nbos/shared';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { assertCallerHasPermission } from '../../../common/authorization/caller-permission';
import { financeClientServiceAccessFromUser } from '../../finance/finance-module-access';
import { credentialsAccessFromUser } from '../../credentials/credentials-access';
import { ClientServicesService } from '../client-services.service';
import { DomainOperationService } from './domain-operation.service';
import type { StartDomainOperationBody } from './domain-operation.types';

const FINANCE_INVOICES_MODULE = 'FINANCE_INVOICES';
const CREDENTIALS_MODULE = 'CREDENTIALS';

@ApiTags('Client services')
@ApiBearerAuth()
@Controller('client-services')
export class DomainOperationController {
  constructor(
    private readonly domainOperations: DomainOperationService,
    private readonly clientServices: ClientServicesService,
  ) {}

  @Post('domain-operations')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'ADD')
  @ApiOperation({ summary: 'Start or reuse a domain purchase/connection for a product' })
  async start(@CurrentUser() user: CurrentUserPayload, @Body() body: StartDomainOperationBody) {
    if (body.issueInvoices) {
      assertCallerHasPermission(user, FINANCE_INVOICES_MODULE, 'ADD');
    }
    return this.domainOperations.start(body, {
      actorEmployeeId: user.id,
      clientServiceAccess: financeClientServiceAccessFromUser(user),
      credentialsAccess: credentialsAccessFromUser(user),
    });
  }

  @Post('domain-operations/preview')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Classify domain purchase or renewal before saving' })
  async preview(@CurrentUser() user: CurrentUserPayload, @Body() body: StartDomainOperationBody) {
    return this.domainOperations.preview(body, {
      actorEmployeeId: user.id,
      clientServiceAccess: financeClientServiceAccessFromUser(user),
      credentialsAccess: credentialsAccessFromUser(user),
    });
  }

  @Get('domain-operations/legacy-dns-report')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Dry-run list of Vault cards named DNS (no migration)' })
  async legacyDnsReport(@CurrentUser() user: CurrentUserPayload) {
    assertCallerHasPermission(user, CREDENTIALS_MODULE, 'VIEW');
    return this.domainOperations.reportLegacyDnsCredentials(credentialsAccessFromUser(user));
  }

  @Get(':id/registrant-data')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Decrypt registration notes for an assigned operator' })
  async getRegistrant(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    await this.assertAccessible(user, id);
    return { registrantData: await this.domainOperations.getRegistrantPlaintext(id, user.id) };
  }

  @Put(':id/registrant-data')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Replace encrypted registration notes' })
  async putRegistrant(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { registrantData?: string | null },
  ) {
    await this.assertAccessible(user, id);
    await this.domainOperations.setRegistrantData(id, body.registrantData ?? '', user.id);
    return { ok: true };
  }

  @Post(':id/actions/confirm-registration')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Mark the domain as registered at the provider' })
  async confirmRegistration(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    await this.assertAccessible(user, id);
    await this.domainOperations.confirmRegistration(id);
    return this.clientServices.findById(id, { access: financeClientServiceAccessFromUser(user) });
  }

  @Post(':id/actions/confirm-connection')
  @RequirePermission(FINANCE_CLIENT_SERVICES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Mark our access as verified (not used for client-DNS)' })
  async confirmConnection(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    await this.assertAccessible(user, id);
    await this.domainOperations.confirmConnection(id);
    return this.clientServices.findById(id, { access: financeClientServiceAccessFromUser(user) });
  }

  private async assertAccessible(user: CurrentUserPayload, id: string): Promise<void> {
    await this.clientServices.assertAccessible(id, {
      access: financeClientServiceAccessFromUser(user),
    });
  }
}
