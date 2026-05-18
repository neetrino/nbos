import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { DriveEntityContextAccess } from './drive-access.types';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';
import { assertDriveEntityContextAccessible } from './drive-entity-context-access';
import {
  normalizeDriveZipExportKind,
  parseDriveZipExportParams,
  type DriveZipExportKind,
  type DriveZipExportParams,
} from './drive-export-kinds';
import { DRIVE_ZIP_EXPORT_MAX_FILES } from './drive-zip-export.constants';

type LinkTarget = { entityType: string; entityId: string };

@Injectable()
export class DriveTypedExportResolver {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async resolveFileIds(
    exportKindInput: string | undefined,
    exportParamsRaw: unknown,
    access: DriveEntityContextAccess,
  ): Promise<{
    exportKind: DriveZipExportKind;
    fileIds: string[];
    exportParams: DriveZipExportParams;
  }> {
    const exportKind = normalizeDriveZipExportKind(exportKindInput);
    const exportParams = parseDriveZipExportParams(exportParamsRaw);

    if (exportKind === 'drive.selection_zip') {
      throw new BadRequestException('selection_zip requires explicit fileIds.');
    }

    const linkTargets = await this.resolveLinkTargets(exportKind, exportParams, access);
    const fileIds = await this.collectAccessibleFileIds(linkTargets, access);
    if (fileIds.length === 0) {
      throw new BadRequestException('No accessible files matched this export.');
    }
    return { exportKind, fileIds, exportParams };
  }

  private async resolveLinkTargets(
    exportKind: DriveZipExportKind,
    params: DriveZipExportParams,
    access: DriveEntityContextAccess,
  ): Promise<LinkTarget[]> {
    switch (exportKind) {
      case 'drive.project_zip': {
        const projectId = requireParam(params.projectId, 'projectId');
        await assertDriveEntityContextAccessible(this.prisma, 'PROJECT', projectId, access);
        return this.projectLinkTargets(projectId);
      }
      case 'drive.product_zip': {
        const productId = requireParam(params.productId, 'productId');
        await assertDriveEntityContextAccessible(this.prisma, 'PRODUCT', productId, access);
        const extensions = await this.prisma.extension.findMany({
          where: { productId },
          select: { id: true },
        });
        return [
          { entityType: 'PRODUCT', entityId: productId },
          ...extensions.map((row) => ({ entityType: 'EXTENSION', entityId: row.id })),
        ];
      }
      case 'drive.client_zip': {
        const companyId = params.companyId?.trim();
        const contactId = params.contactId?.trim();
        if (!companyId && !contactId) {
          throw new BadRequestException('client_zip requires companyId and/or contactId.');
        }
        const targets: LinkTarget[] = [];
        if (companyId) {
          await assertDriveEntityContextAccessible(this.prisma, 'COMPANY', companyId, access);
          targets.push({ entityType: 'COMPANY', entityId: companyId });
        }
        if (contactId) {
          await assertDriveEntityContextAccessible(this.prisma, 'CONTACT', contactId, access);
          targets.push({ entityType: 'CONTACT', entityId: contactId });
        }
        return targets;
      }
      case 'drive.finance_zip': {
        const projectId = requireParam(params.projectId, 'projectId');
        await assertDriveEntityContextAccessible(this.prisma, 'PROJECT', projectId, access);
        return this.financeLinkTargets(projectId);
      }
      case 'drive.task_attachments_zip': {
        if (params.taskId?.trim()) {
          const taskId = params.taskId.trim();
          await assertDriveEntityContextAccessible(this.prisma, 'TASK', taskId, access);
          return [{ entityType: 'TASK', entityId: taskId }];
        }
        const projectId = requireParam(params.projectId, 'projectId');
        await assertDriveEntityContextAccessible(this.prisma, 'PROJECT', projectId, access);
        const tasks = await this.prisma.task.findMany({
          where: { projectId },
          select: { id: true },
        });
        return tasks.map((row) => ({ entityType: 'TASK', entityId: row.id }));
      }
      default:
        throw new BadRequestException('Unsupported export kind.');
    }
  }

  private async projectLinkTargets(projectId: string): Promise<LinkTarget[]> {
    const [deals, products, tasks, invoices] = await Promise.all([
      this.prisma.deal.findMany({ where: { projectId }, select: { id: true } }),
      this.prisma.product.findMany({
        where: { projectId },
        select: { id: true, extensions: { select: { id: true } } },
      }),
      this.prisma.task.findMany({ where: { projectId }, select: { id: true } }),
      this.prisma.invoice.findMany({ where: { projectId }, select: { id: true } }),
    ]);
    const extensionIds = products.flatMap((product) =>
      product.extensions.map((extension) => extension.id),
    );
    return [
      { entityType: 'PROJECT', entityId: projectId },
      ...deals.map((row) => ({ entityType: 'DEAL', entityId: row.id })),
      ...products.map((row) => ({ entityType: 'PRODUCT', entityId: row.id })),
      ...extensionIds.map((id) => ({ entityType: 'EXTENSION', entityId: id })),
      ...tasks.map((row) => ({ entityType: 'TASK', entityId: row.id })),
      ...invoices.map((row) => ({ entityType: 'INVOICE', entityId: row.id })),
    ];
  }

  private async financeLinkTargets(projectId: string): Promise<LinkTarget[]> {
    const [invoices, expenses] = await Promise.all([
      this.prisma.invoice.findMany({ where: { projectId }, select: { id: true } }),
      this.prisma.expense.findMany({ where: { projectId }, select: { id: true } }),
    ]);
    const invoiceIds = invoices.map((row) => row.id);
    const payments =
      invoiceIds.length === 0
        ? []
        : await this.prisma.payment.findMany({
            where: { invoiceId: { in: invoiceIds } },
            select: { id: true },
          });
    return [
      ...invoiceIds.map((id) => ({ entityType: 'INVOICE', entityId: id })),
      ...payments.map((row) => ({ entityType: 'PAYMENT', entityId: row.id })),
      ...expenses.map((row) => ({ entityType: 'EXPENSE', entityId: row.id })),
    ];
  }

  private async collectAccessibleFileIds(
    linkTargets: LinkTarget[],
    access: DriveEntityContextAccess,
  ): Promise<string[]> {
    if (linkTargets.length === 0) return [];
    const accessWhere = await buildDriveAssetAccessWhere(this.prisma, access);
    const linkWhere: Prisma.FileLinkWhereInput = {
      unlinkedAt: null,
      OR: linkTargets.map((target) => ({
        entityType: target.entityType,
        entityId: target.entityId,
      })),
    };
    const rows = await this.prisma.fileAsset.findMany({
      where: { deletedAt: null, ...accessWhere, links: { some: linkWhere } },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: DRIVE_ZIP_EXPORT_MAX_FILES,
    });
    return rows.map((row) => row.id);
  }
}

function requireParam(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new BadRequestException(`${name} is required for this export kind.`);
  }
  return trimmed;
}
