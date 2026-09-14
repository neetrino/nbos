import { randomUUID } from 'node:crypto';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { invalidateEmployeeGuardCache } from '../../common/guards/employee.guard';
import { DriveArtifactOperationService } from '../drive/artifact-operation/drive-artifact-operation.service';
import { allowArtifactAuth } from '../drive/artifact-operation/drive-artifact-auth.ports';
import { DriveR2Client } from '../drive/drive-r2.client';
import { readTenantOrganizationId } from '../drive/drive-tenant';
import { buildStorageHomeKey } from '../drive/drive-storage-home-path';
import { purposeSubfolder } from '../drive/drive-storage-home-purpose';
import { sanitizeUploadBaseName } from '../drive/drive-upload-path';
import { PlatformOwnershipService } from '../platform-ownership/platform-ownership.service';
import { buildEmployeeAvatarDisplayUrl } from './employee-avatar-url';
import { validateEmployeeAvatarUpload } from './employee-avatar-validate';
import {
  EMPLOYEE_AVATAR_ENTITY_TYPE,
  EMPLOYEE_AVATAR_SOURCE_MODULE,
} from './employee-avatar.constants';
import { EmployeesService } from './employees.service';

type AvatarUploadFile = {
  originalName: string;
  mimeType: string;
  bytes: Uint8Array;
};

type AvatarImageBytes = {
  buffer: Buffer;
  mimeType: string;
};

const TERMINATED_STATUS = 'TERMINATED';

@Injectable()
export class EmployeeAvatarService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly employees: EmployeesService,
    private readonly artifacts: DriveArtifactOperationService,
    private readonly r2: DriveR2Client,
    private readonly config: ConfigService,
    private readonly ownership: PlatformOwnershipService,
  ) {}

  async uploadOwn(actorId: string, file: AvatarUploadFile) {
    return this.upload(actorId, actorId, file, false);
  }

  async uploadForEmployee(actorId: string, employeeId: string, file: AvatarUploadFile) {
    return this.upload(actorId, employeeId, file, true);
  }

  async removeOwn(actorId: string) {
    return this.remove(actorId, actorId, false);
  }

  async removeForEmployee(actorId: string, employeeId: string) {
    return this.remove(actorId, employeeId, true);
  }

  async readBytes(employeeId: string): Promise<AvatarImageBytes> {
    const link = await this.prisma.fileLink.findFirst({
      where: {
        entityType: EMPLOYEE_AVATAR_ENTITY_TYPE,
        entityId: employeeId,
        unlinkedAt: null,
        fileAsset: { deletedAt: null, storageProvider: 'R2' },
      },
      include: {
        fileAsset: {
          include: {
            versions: { where: { isCurrent: true }, take: 1, orderBy: { versionNumber: 'desc' } },
          },
        },
      },
      orderBy: { linkedAt: 'desc' },
    });
    if (!link) {
      throw new NotFoundException('Profile photo is not set.');
    }
    const key = link.fileAsset.versions[0]?.storageKey ?? link.fileAsset.storageKey;
    if (!key) {
      throw new NotFoundException('Profile photo is not set.');
    }
    const mimeType = link.fileAsset.mimeType ?? 'application/octet-stream';
    const response = await this.r2
      .ensureS3()
      .send(new GetObjectCommand({ Bucket: this.r2.bucket, Key: key }));
    const stream = response.Body;
    if (!stream) {
      throw new NotFoundException('Profile photo is not set.');
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return {
      buffer: Buffer.concat(chunks),
      mimeType,
    };
  }

  private async upload(actorId: string, employeeId: string, file: AvatarUploadFile, asHr: boolean) {
    await this.assertCanMutate(actorId, employeeId, asHr);
    const photo = validateEmployeeAvatarUpload(file);
    const contentChecksum = this.artifacts.fingerprintBytes(photo.bytes);
    const displayName = sanitizeUploadBaseName(`avatar.${photo.extension}`);
    const operation = await this.artifacts.prepare({
      source: 'HUMAN',
      ingress: 'MACHINE_PUT',
      kind: 'CREATE_ASSET',
      storageKey: this.buildStorageKey(employeeId, displayName),
      entityType: EMPLOYEE_AVATAR_ENTITY_TYPE,
      entityId: employeeId,
      displayName,
      originalName: displayName,
      mimeType: photo.mimeType,
      purpose: 'OTHER',
      sourceModule: EMPLOYEE_AVATAR_SOURCE_MODULE,
      visibility: 'INTERNAL',
      confidentiality: 'PUBLIC_INTERNAL',
      linkType: 'OTHER',
      expectedSizeBytes: photo.bytes.byteLength,
      checksum: contentChecksum,
      payloadFingerprint: contentChecksum,
      actorType: 'EMPLOYEE',
      actorId,
      createdByEmployeeId: actorId,
    });
    const result = await this.artifacts.executeMachineUpload(
      operation.id,
      photo.bytes,
      allowArtifactAuth(),
    );
    await this.persistAvatarPointer(employeeId, result.fileAssetId);
    return this.employees.findById(employeeId);
  }

  private async persistAvatarPointer(employeeId: string, fileAssetId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.fileLink.updateMany({
        where: {
          entityType: EMPLOYEE_AVATAR_ENTITY_TYPE,
          entityId: employeeId,
          unlinkedAt: null,
          fileAssetId: { not: fileAssetId },
        },
        data: { unlinkedAt: new Date() },
      });
      await tx.employee.update({
        where: { id: employeeId },
        data: { avatar: buildEmployeeAvatarDisplayUrl(employeeId, fileAssetId) },
      });
    });
    invalidateEmployeeGuardCache(employeeId);
  }

  private async remove(actorId: string, employeeId: string, asHr: boolean) {
    await this.assertCanMutate(actorId, employeeId, asHr);
    await this.prisma.$transaction(async (tx) => {
      await tx.fileLink.updateMany({
        where: {
          entityType: EMPLOYEE_AVATAR_ENTITY_TYPE,
          entityId: employeeId,
          unlinkedAt: null,
        },
        data: { unlinkedAt: new Date() },
      });
      await tx.employee.update({
        where: { id: employeeId },
        data: { avatar: null },
      });
    });
    invalidateEmployeeGuardCache(employeeId);
    return this.employees.findById(employeeId);
  }

  private async assertCanMutate(actorId: string, employeeId: string, asHr: boolean): Promise<void> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    if (employee.status === TERMINATED_STATUS) {
      throw new ForbiddenException('Terminated employees cannot change a profile photo.');
    }
    if (asHr) {
      await this.ownership.assertFounderNotMutatedByOthers(actorId, employeeId);
      return;
    }
    if (actorId !== employeeId) {
      throw new ForbiddenException('You can only change your own profile photo.');
    }
  }

  private buildStorageKey(employeeId: string, fileName: string): string {
    const orgId = readTenantOrganizationId(this.config);
    const context = `employees/${employeeId.slice(0, 8)}/${purposeSubfolder('OTHER')}`;
    return buildStorageHomeKey(orgId, context, `${randomUUID()}-${fileName}`);
  }
}
