import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { activeResourceAccessGrantWhere } from '../credentials/credential-active-grant.where';
import {
  DRIVE_FOLDER_RESOURCE_TYPE,
  parseDriveGrantPermissionFromReason,
  revokeDriveFileResourceAccessGrant,
  syncDriveFileResourceAccessGrant,
} from './drive-resource-access-grant.sync';
import { normalizeFileGrantPermission } from './drive-grant-permissions';
import { jsonSafeForHttp } from './drive-json-safe';
import { DriveFolderService } from './drive-folder.service';
import type { CreateFileAssetGrantDto } from './drive.types';
import type { DriveEntityContextAccess } from './drive-access.types';

@Injectable()
export class DriveFolderGrantService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly driveFolders: DriveFolderService,
  ) {}

  async listGrants(folderId: string, actorId: string, access?: DriveEntityContextAccess) {
    await this.driveFolders.assertCanUseFolder(folderId, actorId, access);
    const rows = await this.prisma.resourceAccessGrant.findMany({
      where: {
        resourceType: DRIVE_FOLDER_RESOURCE_TYPE,
        resourceId: folderId,
        ...activeResourceAccessGrantWhere(),
      },
      orderBy: { createdAt: 'asc' },
    });
    if (rows.length === 0) return [];
    const empIds = [...new Set(rows.map((r) => r.employeeId))];
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: empIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const employeeById = new Map(employees.map((e) => [e.id, e]));
    return rows.map((row) => {
      const employee = employeeById.get(row.employeeId);
      return {
        id: row.id,
        granteeEmployeeId: row.employeeId,
        granteeLabel: employee
          ? `${employee.firstName} ${employee.lastName}`.trim()
          : row.employeeId,
        granteeEmail: employee?.email ?? null,
        permission:
          parseDriveGrantPermissionFromReason(row.reason) ??
          (row.level === 'EDIT' ? 'EDIT_METADATA' : 'VIEW'),
        expiresAt: row.expiresAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  async createGrant(
    folderId: string,
    body: CreateFileAssetGrantDto,
    actorId: string,
    access?: DriveEntityContextAccess,
  ) {
    const grantee = body.granteeEmployeeId.trim();
    if (!grantee) throw new BadRequestException('granteeEmployeeId is required');
    if (grantee === actorId) {
      throw new BadRequestException('You cannot grant folder access to yourself.');
    }
    const permission = normalizeFileGrantPermission(body.permission ?? 'VIEW');
    const expiresAt = this.parseExpiry(body.expiresAt);
    await this.driveFolders.assertCanManageFolderGrants(folderId, actorId, access);

    await syncDriveFileResourceAccessGrant(this.prisma, {
      fileAssetId: folderId,
      employeeId: grantee,
      permission,
      grantedById: actorId,
      expiresAt,
      auditReason: body.reason ?? null,
      resourceType: DRIVE_FOLDER_RESOURCE_TYPE,
    });

    const rows = await this.listGrants(folderId, actorId, access);
    const created = rows.find((r) => r.granteeEmployeeId === grantee);
    return jsonSafeForHttp(created ?? rows[rows.length - 1]);
  }

  async revokeGrant(
    folderId: string,
    grantId: string,
    actorId: string,
    access?: DriveEntityContextAccess,
  ) {
    await this.driveFolders.assertCanManageFolderGrants(folderId, actorId, access);
    const grant = await this.prisma.resourceAccessGrant.findFirst({
      where: {
        id: grantId,
        resourceType: DRIVE_FOLDER_RESOURCE_TYPE,
        resourceId: folderId,
        revokedAt: null,
      },
    });
    if (!grant) throw new NotFoundException('Grant not found or already revoked.');
    await revokeDriveFileResourceAccessGrant(
      this.prisma,
      folderId,
      grant.employeeId,
      DRIVE_FOLDER_RESOURCE_TYPE,
    );
    return jsonSafeForHttp({ id: grantId, revoked: true });
  }

  private parseExpiry(value: string | undefined): Date | null {
    if (!value?.trim()) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('expiresAt must be a valid ISO datetime.');
    }
    return parsed;
  }
}
