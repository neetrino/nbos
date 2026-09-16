import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { actorContextFromUserId, DOMAIN_REGISTRANT_DATA_MAX_LENGTH } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import type { CredentialsAccessContext } from '../../credentials/credentials-access';
import type { FinanceScopedAccessContext } from '../../finance/finance-scoped-access';
import { fillCredentialContextIfEmpty } from '../../expenses/expense-credential-link';
import { PlatformAccessResolverService } from '../../platform-access/platform-access-resolver.service';
import { ClientServiceFlowsService } from '../client-service-flows.service';
import { applyOneDomainOperation } from './domain-operation-apply';
import {
  assertAccessibleDomainCredentials,
  credentialVisibilityWhereForReport,
  requireAccessibleDomainProduct,
} from './domain-operation-access';
import { reportLegacyDnsCredentials } from './domain-legacy-dns-report';
import { normalizeStartDomainOperationBody } from './domain-operation-normalize';
import type {
  DomainLegacyDnsReportRow,
  DomainOperationItemResult,
  StartDomainOperationBody,
  StartDomainOperationResult,
} from './domain-operation.types';
import { encryptRegistrantData, decryptRegistrantData } from './registrant-data.crypto';
import { syncOpenExpenseCredentialFromService } from './late-credential-sync';

export interface DomainOperationActorContext {
  actorEmployeeId: string;
  clientServiceAccess: FinanceScopedAccessContext;
  credentialsAccess: CredentialsAccessContext;
}

@Injectable()
export class DomainOperationService {
  private readonly logger = new Logger(DomainOperationService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly flows: ClientServiceFlowsService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly platformAccessResolver: PlatformAccessResolverService,
  ) {}

  async start(
    body: StartDomainOperationBody,
    actor: DomainOperationActorContext,
  ): Promise<StartDomainOperationResult> {
    const input = normalizeStartDomainOperationBody(body);
    const product = await requireAccessibleDomainProduct(
      this.prisma,
      input.productId,
      actor.clientServiceAccess,
    );
    await assertAccessibleDomainCredentials(
      this.prisma,
      this.platformAccessResolver,
      actor.credentialsAccess,
      input.domains.map((domain) => domain.providerAccountId ?? ''),
    );
    const encryptedRegistrantData = this.encryptRegistrant(input.registrantData);
    const items = await this.applyDomains(product, input, encryptedRegistrantData);
    if (encryptedRegistrantData) {
      await this.auditRegistrantWrite(product.projectId, actor.actorEmployeeId, items);
    }
    return { productId: product.id, connectionMode: input.connectionMode, items };
  }

  async setRegistrantData(serviceId: string, plaintext: string, actorEmployeeId: string) {
    const trimmed = plaintext.trim();
    if (trimmed.length > DOMAIN_REGISTRANT_DATA_MAX_LENGTH) {
      throw new BadRequestException('Registrant data exceeds the allowed length');
    }
    const row = await this.requireActiveService(serviceId);
    const encrypted = trimmed ? this.encryptRegistrant(trimmed) : null;
    await this.prisma.clientServiceRecord.update({
      where: { id: serviceId },
      data: { encryptedRegistrantData: encrypted, registrantDataUpdatedAt: new Date() },
    });
    await this.audit.log({
      entityType: 'ClientServiceRecord',
      entityId: serviceId,
      action: 'REGISTRANT_DATA_UPDATED',
      userId: actorEmployeeId,
      actor: actorContextFromUserId(actorEmployeeId),
      projectId: row.projectId,
      changes: { hasRegistrantData: Boolean(encrypted) },
    });
  }

  async confirmRegistration(serviceId: string): Promise<void> {
    await this.requireActiveService(serviceId);
    await this.prisma.clientServiceRecord.update({
      where: { id: serviceId },
      data: { registrationConfirmedAt: new Date(), status: 'ACTIVE' },
    });
  }

  async confirmConnection(serviceId: string): Promise<void> {
    const row = await this.prisma.clientServiceRecord.findUnique({
      where: { id: serviceId },
      select: { connectionMode: true, providerAccountId: true, status: true },
    });
    if (!row || row.status === 'CANCELLED') {
      throw new NotFoundException('Client service record not found');
    }
    if (row.connectionMode === 'CLIENT_DNS') {
      throw new BadRequestException('Client-DNS domains do not require connection verification.');
    }
    if (!row.providerAccountId) {
      throw new BadRequestException('Save a registrar credential before verifying connection.');
    }
    await this.prisma.clientServiceRecord.update({
      where: { id: serviceId },
      data: { connectionVerifiedAt: new Date() },
    });
  }

  async afterCredentialLinked(serviceId: string, credentialId: string | null): Promise<void> {
    await fillCredentialContextIfEmpty(this.prisma, credentialId, {
      clientServiceRecordId: serviceId,
    });
    await syncOpenExpenseCredentialFromService(this.prisma, serviceId, credentialId);
  }

  async reportLegacyDnsCredentials(
    credentialsAccess: CredentialsAccessContext,
  ): Promise<DomainLegacyDnsReportRow[]> {
    const visibility = await credentialVisibilityWhereForReport(
      this.prisma,
      this.platformAccessResolver,
      credentialsAccess,
    );
    return reportLegacyDnsCredentials(this.prisma, visibility);
  }

  async getRegistrantPlaintext(serviceId: string, actorEmployeeId: string): Promise<string | null> {
    const row = await this.requireActiveService(serviceId);
    if (!row.encryptedRegistrantData) return null;
    const key = this.config.get<string>('CREDENTIALS_ENCRYPTION_KEY');
    if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not configured');
    const plaintext = decryptRegistrantData(row.encryptedRegistrantData, key);
    await this.audit.log({
      entityType: 'ClientServiceRecord',
      entityId: serviceId,
      action: 'REGISTRANT_DATA_VIEWED',
      userId: actorEmployeeId,
      actor: actorContextFromUserId(actorEmployeeId),
      projectId: row.projectId,
      changes: { hasRegistrantData: true },
    });
    return plaintext;
  }

  private async applyDomains(
    product: { id: string; projectId: string },
    input: ReturnType<typeof normalizeStartDomainOperationBody>,
    encryptedRegistrantData: string | null,
  ): Promise<DomainOperationItemResult[]> {
    const items: DomainOperationItemResult[] = [];
    for (const domain of input.domains) {
      try {
        items.push(
          await applyOneDomainOperation(this.prisma, this.flows, {
            projectId: product.projectId,
            productId: product.id,
            connectionMode: input.connectionMode,
            domain,
            encryptedRegistrantData,
            dnsInstructions: input.dnsInstructions,
            issueInvoices: input.issueInvoices,
          }),
        );
      } catch (caught) {
        items.push({
          domainName: domain.domainName,
          status: 'failed',
          message: caught instanceof Error ? caught.message : 'Domain could not be saved.',
        });
      }
    }
    return items;
  }

  private async auditRegistrantWrite(
    projectId: string,
    actorEmployeeId: string,
    items: readonly DomainOperationItemResult[],
  ): Promise<void> {
    for (const item of items) {
      if (!item.serviceId) continue;
      await this.audit.log({
        entityType: 'ClientServiceRecord',
        entityId: item.serviceId,
        action: 'REGISTRANT_DATA_UPDATED',
        userId: actorEmployeeId,
        actor: actorContextFromUserId(actorEmployeeId),
        projectId,
        changes: { hasRegistrantData: true, domainName: item.domainName },
      });
    }
  }

  private encryptRegistrant(plaintext: string | null): string | null {
    if (!plaintext) return null;
    const key = this.config.get<string>('CREDENTIALS_ENCRYPTION_KEY');
    if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not configured');
    try {
      return encryptRegistrantData(plaintext, key);
    } catch (caught) {
      this.logger.warn('Registrant data was rejected');
      throw new BadRequestException(
        caught instanceof Error ? caught.message : 'Registrant data could not be stored.',
      );
    }
  }

  private async requireActiveService(serviceId: string) {
    const row = await this.prisma.clientServiceRecord.findUnique({
      where: { id: serviceId },
      select: { id: true, projectId: true, status: true, encryptedRegistrantData: true },
    });
    if (!row || row.status === 'CANCELLED') {
      throw new NotFoundException('Client service record not found');
    }
    return row;
  }
}
