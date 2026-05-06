import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { buildTechnicalReadiness } from './technical-readiness';
import type {
  CreateTechnicalAssetDto,
  CreateTechnicalEnvironmentDto,
  UpdateTechnicalAssetDto,
  UpdateTechnicalEnvironmentDto,
  UpdateTechnicalProfileDto,
} from './technical.types';

@Injectable()
export class TechnicalService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  async getProductProfile(productId: string) {
    const product = await this.getProductContext(productId);
    const profile = await this.ensureProfile(product.id, product.projectId);
    const [assets, environments, incidentSummary, recentIncidents] = await Promise.all([
      this.prisma.technicalAsset.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.technicalEnvironment.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['priority'],
        where: {
          productId,
          category: 'INCIDENT',
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
        _count: true,
      }),
      this.prisma.supportTicket.findMany({
        where: {
          productId,
          category: 'INCIDENT',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          code: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
          assignedTo: true,
        },
      }),
    ]);
    const openIncidentCount = incidentSummary.reduce((acc, row) => acc + row._count, 0);
    const criticalIncidentCount = incidentSummary
      .filter((row) => row.priority === 'P1')
      .reduce((acc, row) => acc + row._count, 0);
    const missingOwnerCount = assets.filter((asset) => !asset.ownerId).length;
    const missingCredentialLinkCount =
      assets.filter((asset) => !asset.credentialId).length +
      environments.filter((env) => !env.envCredentialId).length;
    const warningAssetCount = assets.filter((asset) => asset.status === 'WARNING').length;
    const criticalAssetCount = assets.filter((asset) => asset.status === 'BROKEN').length;
    return {
      product,
      profile,
      assets,
      environments,
      support: {
        openIncidentCount,
        criticalIncidentCount,
        recentIncidents,
      },
      monitoringBaseline: {
        monitoringStatus: profile.monitoringStatus,
        backupStatus: profile.backupStatus,
        warningAssetCount,
        criticalAssetCount,
        missingOwnerCount,
        missingCredentialLinkCount,
      },
      readiness: buildTechnicalReadiness({ profile, assets, environments }),
    };
  }

  async updateProfile(productId: string, actorId: string, body: UpdateTechnicalProfileDto) {
    const product = await this.getProductContext(productId);
    await this.ensureProfile(product.id, product.projectId);
    const profile = await this.prisma.productTechnicalProfile.update({
      where: { productId },
      data: {
        technicalOwnerId: nullable(body.technicalOwnerId),
        productionUrl: nullable(body.productionUrl),
        stagingUrl: nullable(body.stagingUrl),
        repositoryUrl: nullable(body.repositoryUrl),
        deploymentMethod: nullable(body.deploymentMethod),
        hostingProvider: nullable(body.hostingProvider),
        monitoringStatus: body.monitoringStatus,
        backupStatus: body.backupStatus,
        lastDeployAt: body.lastDeployAt ? new Date(body.lastDeployAt) : nullable(body.lastDeployAt),
        lastDeployStatus: body.lastDeployStatus,
        technicalNotes: nullable(body.technicalNotes),
      },
    });
    await this.log(actorId, product.projectId, profile.id, 'technical.profile_updated');
    return this.getProductProfile(productId);
  }

  async createAsset(productId: string, actorId: string, body: CreateTechnicalAssetDto) {
    const product = await this.getProductContext(productId);
    const name = requiredText(body.name, 'name');
    const asset = await this.prisma.technicalAsset.create({
      data: {
        productId,
        projectId: product.projectId,
        type: body.type ?? 'OTHER',
        name,
        provider: nullable(body.provider),
        environment: body.environment ?? null,
        status: body.status ?? 'UNKNOWN',
        url: nullable(body.url),
        ownerId: nullable(body.ownerId),
        credentialId: nullable(body.credentialId),
        clientServiceRecordId: nullable(body.clientServiceRecordId),
        notes: nullable(body.notes),
      },
    });
    await this.log(actorId, product.projectId, asset.id, 'technical.asset_created');
    return this.getProductProfile(productId);
  }

  async updateAsset(
    productId: string,
    assetId: string,
    actorId: string,
    body: UpdateTechnicalAssetDto,
  ) {
    const asset = await this.findOwnedAsset(productId, assetId);
    await this.prisma.technicalAsset.update({
      where: { id: asset.id },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.name !== undefined && { name: requiredText(body.name, 'name') }),
        ...(body.provider !== undefined && { provider: nullable(body.provider) }),
        ...(body.environment !== undefined && { environment: body.environment }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.url !== undefined && { url: nullable(body.url) }),
        ...(body.ownerId !== undefined && { ownerId: nullable(body.ownerId) }),
        ...(body.credentialId !== undefined && { credentialId: nullable(body.credentialId) }),
        ...(body.clientServiceRecordId !== undefined && {
          clientServiceRecordId: nullable(body.clientServiceRecordId),
        }),
        ...(body.notes !== undefined && { notes: nullable(body.notes) }),
      },
    });
    await this.log(actorId, asset.projectId, asset.id, 'technical.asset_updated');
    return this.getProductProfile(productId);
  }

  async createEnvironment(productId: string, actorId: string, body: CreateTechnicalEnvironmentDto) {
    const product = await this.getProductContext(productId);
    const env = await this.prisma.technicalEnvironment.create({
      data: buildEnvironmentWrite(productId, product.projectId, body),
    });
    await this.log(actorId, product.projectId, env.id, 'technical.environment_created');
    return this.getProductProfile(productId);
  }

  async updateEnvironment(
    productId: string,
    environmentId: string,
    actorId: string,
    body: UpdateTechnicalEnvironmentDto,
  ) {
    const env = await this.findOwnedEnvironment(productId, environmentId);
    await this.prisma.technicalEnvironment.update({
      where: { id: env.id },
      data: buildEnvironmentPatch(body),
    });
    await this.log(actorId, env.projectId, env.id, 'technical.environment_updated');
    return this.getProductProfile(productId);
  }

  private async getProductContext(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        projectId: true,
        project: { select: { id: true, name: true } },
      },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    return product;
  }

  private ensureProfile(productId: string, projectId: string) {
    return this.prisma.productTechnicalProfile.upsert({
      where: { productId },
      create: { productId, projectId },
      update: {},
    });
  }

  private async findOwnedAsset(productId: string, assetId: string) {
    const asset = await this.prisma.technicalAsset.findFirst({ where: { id: assetId, productId } });
    if (!asset) throw new NotFoundException(`Technical asset ${assetId} not found`);
    return asset;
  }

  private async findOwnedEnvironment(productId: string, environmentId: string) {
    const env = await this.prisma.technicalEnvironment.findFirst({
      where: { id: environmentId, productId },
    });
    if (!env) throw new NotFoundException(`Technical environment ${environmentId} not found`);
    return env;
  }

  private log(userId: string, projectId: string, entityId: string, action: string) {
    return this.audit.log({
      entityType: 'TechnicalInfrastructure',
      entityId,
      action,
      userId,
      projectId,
    });
  }
}

function nullable(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function requiredText(value: string | undefined, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new BadRequestException(`${field} is required`);
  return trimmed;
}

function buildEnvironmentWrite(
  productId: string,
  projectId: string,
  body: CreateTechnicalEnvironmentDto,
) {
  return {
    productId,
    projectId,
    kind: body.kind ?? 'PRODUCTION',
    name: requiredText(body.name, 'name'),
    url: nullable(body.url),
    branch: nullable(body.branch),
    deploymentTarget: nullable(body.deploymentTarget),
    envCredentialId: nullable(body.envCredentialId),
    databaseAssetId: nullable(body.databaseAssetId),
    status: body.status ?? 'UNKNOWN',
    lastCheckedAt: body.lastCheckedAt ? new Date(body.lastCheckedAt) : null,
  };
}

function buildEnvironmentPatch(body: UpdateTechnicalEnvironmentDto) {
  return {
    ...(body.kind !== undefined && { kind: body.kind }),
    ...(body.name !== undefined && { name: requiredText(body.name, 'name') }),
    ...(body.url !== undefined && { url: nullable(body.url) }),
    ...(body.branch !== undefined && { branch: nullable(body.branch) }),
    ...(body.deploymentTarget !== undefined && {
      deploymentTarget: nullable(body.deploymentTarget),
    }),
    ...(body.envCredentialId !== undefined && { envCredentialId: nullable(body.envCredentialId) }),
    ...(body.databaseAssetId !== undefined && { databaseAssetId: nullable(body.databaseAssetId) }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.lastCheckedAt !== undefined && {
      lastCheckedAt: body.lastCheckedAt ? new Date(body.lastCheckedAt) : null,
    }),
  };
}
