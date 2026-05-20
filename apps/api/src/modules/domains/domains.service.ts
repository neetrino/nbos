import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type DomainStatusEnum, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { syncDomainClientServiceRecord } from './domain-client-service-sync';
import type { CreateDomainBody, UpdateDomainBody } from './domains.types';

const DOMAIN_STATUSES = new Set(['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TRANSFERRED']);

const domainSelect = {
  id: true,
  projectId: true,
  domainName: true,
  provider: true,
  purchaseDate: true,
  expiryDate: true,
  renewalCost: true,
  clientCharge: true,
  autoRenew: true,
  status: true,
  clientServiceRecordId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DomainSelect;

@Injectable()
export class DomainsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listByProject(projectId: string) {
    await this.assertProjectExists(projectId);
    const items = await this.prisma.domain.findMany({
      where: { projectId },
      select: domainSelect,
      orderBy: { expiryDate: 'asc' },
    });
    return { items: items.map(serializeDomain) };
  }

  async create(projectId: string, body: CreateDomainBody) {
    await this.assertProjectExists(projectId);
    const domainName = body.domainName?.trim().toLowerCase();
    if (!domainName) throw new BadRequestException('domainName is required');

    return this.prisma.$transaction(async (tx) => {
      const domain = await tx.domain.create({
        data: {
          projectId,
          domainName,
          provider: body.provider?.trim() || null,
          purchaseDate: parseOptionalDate(body.purchaseDate, 'purchaseDate'),
          expiryDate: parseOptionalDate(body.expiryDate, 'expiryDate'),
          renewalCost: parseOptionalMoney(body.renewalCost, 'renewalCost'),
          clientCharge: parseOptionalMoney(body.clientCharge, 'clientCharge'),
          autoRenew: body.autoRenew ?? true,
          status: parseDomainStatus(body.status),
        },
        select: domainSelect,
      });

      const clientServiceRecordId = await syncDomainClientServiceRecord(tx, domain);
      const linked = await tx.domain.findUniqueOrThrow({
        where: { id: domain.id },
        select: domainSelect,
      });
      return serializeDomain({ ...linked, clientServiceRecordId });
    });
  }

  async update(domainId: string, body: UpdateDomainBody) {
    const existing = await this.prisma.domain.findUnique({
      where: { id: domainId },
      select: domainSelect,
    });
    if (!existing) throw new NotFoundException(`Domain ${domainId} not found`);

    return this.prisma.$transaction(async (tx) => {
      const domain = await tx.domain.update({
        where: { id: domainId },
        data: {
          ...(body.domainName !== undefined
            ? { domainName: body.domainName.trim().toLowerCase() }
            : {}),
          ...(body.provider !== undefined ? { provider: body.provider?.trim() || null } : {}),
          ...(body.purchaseDate !== undefined
            ? { purchaseDate: parseOptionalDate(body.purchaseDate, 'purchaseDate') }
            : {}),
          ...(body.expiryDate !== undefined
            ? { expiryDate: parseOptionalDate(body.expiryDate, 'expiryDate') }
            : {}),
          ...(body.renewalCost !== undefined
            ? { renewalCost: parseOptionalMoney(body.renewalCost, 'renewalCost') }
            : {}),
          ...(body.clientCharge !== undefined
            ? { clientCharge: parseOptionalMoney(body.clientCharge, 'clientCharge') }
            : {}),
          ...(body.autoRenew !== undefined ? { autoRenew: body.autoRenew } : {}),
          ...(body.status !== undefined ? { status: parseDomainStatus(body.status) } : {}),
        },
        select: domainSelect,
      });

      const clientServiceRecordId = await syncDomainClientServiceRecord(tx, domain);
      return serializeDomain({ ...domain, clientServiceRecordId });
    });
  }

  async syncClientService(domainId: string) {
    const domain = await this.prisma.domain.findUnique({
      where: { id: domainId },
      select: domainSelect,
    });
    if (!domain) throw new NotFoundException(`Domain ${domainId} not found`);

    const clientServiceRecordId = await this.prisma.$transaction((tx) =>
      syncDomainClientServiceRecord(tx, domain),
    );
    return { domainId, clientServiceRecordId };
  }

  private async assertProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }
}

function parseDomainStatus(value: string | undefined): DomainStatusEnum {
  const normalized = value?.trim() ?? 'ACTIVE';
  if (!DOMAIN_STATUSES.has(normalized)) {
    throw new BadRequestException('status is invalid');
  }
  return normalized as DomainStatusEnum;
}

function parseOptionalDate(value: string | undefined, field: string): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`${field} is invalid`);
  return d;
}

function parseOptionalMoney(value: number | undefined, field: string): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new BadRequestException(`${field} must be a non-negative number`);
  }
  return value;
}

function serializeDomain(row: Prisma.DomainGetPayload<{ select: typeof domainSelect }>) {
  return {
    id: row.id,
    projectId: row.projectId,
    clientServiceRecordId: row.clientServiceRecordId,
    domainName: row.domainName,
    provider: row.provider,
    purchaseDate: row.purchaseDate?.toISOString() ?? null,
    expiryDate: row.expiryDate?.toISOString() ?? null,
    renewalCost: row.renewalCost?.toString() ?? null,
    clientCharge: row.clientCharge?.toString() ?? null,
    autoRenew: row.autoRenew,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
