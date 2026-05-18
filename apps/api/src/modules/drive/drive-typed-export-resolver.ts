import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { DriveEntityContextAccess } from './drive-access.types';
import { assertDriveEntityContextAccessible } from './drive-entity-context-access';
import {
  DRIVE_EXPORT_CALL_PURPOSES,
  DRIVE_EXPORT_MEETING_PURPOSES,
  DRIVE_EXPORT_OFFER_PURPOSES,
} from './drive-export-purpose-filters';
import {
  normalizeDriveZipExportKind,
  parseDriveZipExportParams,
  type DriveZipExportKind,
  type DriveZipExportParams,
} from './drive-export-kinds';
import {
  collectAccessibleExportFileIds,
  type DriveExportLinkTarget,
} from './drive-typed-export-collect';

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

    const resolved = await this.resolveCollection(exportKind, exportParams, access);
    if (resolved.fileIds.length === 0) {
      throw new BadRequestException('No accessible files matched this export.');
    }
    return { exportKind, fileIds: resolved.fileIds, exportParams };
  }

  private async resolveCollection(
    exportKind: DriveZipExportKind,
    params: DriveZipExportParams,
    access: DriveEntityContextAccess,
  ): Promise<{ fileIds: string[] }> {
    switch (exportKind) {
      case 'drive.project_zip': {
        const projectId = requireParam(params.projectId, 'projectId');
        await assertDriveEntityContextAccessible(this.prisma, 'PROJECT', projectId, access);
        const fileIds = await collectAccessibleExportFileIds(
          this.prisma,
          await this.projectLinkTargets(projectId),
          access,
        );
        return { fileIds };
      }
      case 'drive.product_zip': {
        const productId = requireParam(params.productId, 'productId');
        await assertDriveEntityContextAccessible(this.prisma, 'PRODUCT', productId, access);
        const extensions = await this.prisma.extension.findMany({
          where: { productId },
          select: { id: true },
        });
        const targets: DriveExportLinkTarget[] = [
          { entityType: 'PRODUCT', entityId: productId },
          ...extensions.map((row) => ({ entityType: 'EXTENSION', entityId: row.id })),
        ];
        const fileIds = await collectAccessibleExportFileIds(this.prisma, targets, access);
        return { fileIds };
      }
      case 'drive.client_zip': {
        const companyId = params.companyId?.trim();
        const contactId = params.contactId?.trim();
        if (!companyId && !contactId) {
          throw new BadRequestException('client_zip requires companyId and/or contactId.');
        }
        const targets: DriveExportLinkTarget[] = [];
        if (companyId) {
          await assertDriveEntityContextAccessible(this.prisma, 'COMPANY', companyId, access);
          targets.push({ entityType: 'COMPANY', entityId: companyId });
        }
        if (contactId) {
          await assertDriveEntityContextAccessible(this.prisma, 'CONTACT', contactId, access);
          targets.push({ entityType: 'CONTACT', entityId: contactId });
        }
        const fileIds = await collectAccessibleExportFileIds(this.prisma, targets, access);
        return { fileIds };
      }
      case 'drive.finance_zip': {
        const projectId = requireParam(params.projectId, 'projectId');
        await assertDriveEntityContextAccessible(this.prisma, 'PROJECT', projectId, access);
        const fileIds = await collectAccessibleExportFileIds(
          this.prisma,
          await this.financeLinkTargets(projectId),
          access,
        );
        return { fileIds };
      }
      case 'drive.task_attachments_zip': {
        if (params.taskId?.trim()) {
          const taskId = params.taskId.trim();
          await assertDriveEntityContextAccessible(this.prisma, 'TASK', taskId, access);
          const fileIds = await collectAccessibleExportFileIds(
            this.prisma,
            [{ entityType: 'TASK', entityId: taskId }],
            access,
          );
          return { fileIds };
        }
        const projectId = requireParam(params.projectId, 'projectId');
        await assertDriveEntityContextAccessible(this.prisma, 'PROJECT', projectId, access);
        const tasks = await this.prisma.task.findMany({
          where: { projectId },
          select: { id: true },
        });
        const targets = tasks.map((row) => ({ entityType: 'TASK', entityId: row.id }));
        const fileIds = await collectAccessibleExportFileIds(this.prisma, targets, access);
        return { fileIds };
      }
      case 'drive.offer_zip':
        return this.purposeScopedExport(params, access, [...DRIVE_EXPORT_OFFER_PURPOSES]);
      case 'drive.meeting_zip':
        return this.purposeScopedExport(params, access, [...DRIVE_EXPORT_MEETING_PURPOSES]);
      case 'drive.call_zip':
        return this.purposeScopedExport(params, access, [...DRIVE_EXPORT_CALL_PURPOSES]);
      case 'drive.partner_zip': {
        const partnerId = requireParam(params.partnerId, 'partnerId');
        await assertDriveEntityContextAccessible(this.prisma, 'PARTNER', partnerId, access);
        const fileIds = await collectAccessibleExportFileIds(
          this.prisma,
          [{ entityType: 'PARTNER', entityId: partnerId }],
          access,
        );
        return { fileIds };
      }
      case 'drive.full_backup_zip': {
        const projectId = requireParam(params.projectId, 'projectId');
        await assertDriveEntityContextAccessible(this.prisma, 'PROJECT', projectId, access);
        const fileIds = await collectAccessibleExportFileIds(
          this.prisma,
          await this.projectLinkTargets(projectId),
          access,
          { includeArchived: true },
        );
        return { fileIds };
      }
      default:
        throw new BadRequestException('Unsupported export kind.');
    }
  }

  private async purposeScopedExport(
    params: DriveZipExportParams,
    access: DriveEntityContextAccess,
    purposes: string[],
  ): Promise<{ fileIds: string[] }> {
    const targets = await this.resolveOfferScopeTargets(params, access);
    const fileIds = await collectAccessibleExportFileIds(this.prisma, targets, access, {
      purposes,
    });
    return { fileIds };
  }

  private async resolveOfferScopeTargets(
    params: DriveZipExportParams,
    access: DriveEntityContextAccess,
  ): Promise<DriveExportLinkTarget[]> {
    const dealId = params.dealId?.trim();
    if (dealId) {
      await assertDriveEntityContextAccessible(this.prisma, 'DEAL', dealId, access);
      return [{ entityType: 'DEAL', entityId: dealId }];
    }
    const projectId = params.projectId?.trim();
    const contactId = params.contactId?.trim();
    if (contactId) {
      await assertDriveEntityContextAccessible(this.prisma, 'CONTACT', contactId, access);
      return [{ entityType: 'CONTACT', entityId: contactId }];
    }
    if (projectId) {
      await assertDriveEntityContextAccessible(this.prisma, 'PROJECT', projectId, access);
      const deals = await this.prisma.deal.findMany({
        where: { projectId },
        select: { id: true },
      });
      return [
        { entityType: 'PROJECT', entityId: projectId },
        ...deals.map((row) => ({ entityType: 'DEAL', entityId: row.id })),
      ];
    }
    throw new BadRequestException(
      'This export requires projectId, dealId, or contactId in exportParams.',
    );
  }

  private async projectLinkTargets(projectId: string): Promise<DriveExportLinkTarget[]> {
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

  private async financeLinkTargets(projectId: string): Promise<DriveExportLinkTarget[]> {
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
}

function requireParam(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new BadRequestException(`${name} is required for this export kind.`);
  }
  return trimmed;
}
