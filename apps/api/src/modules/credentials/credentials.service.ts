import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PlatformAccessResolverService } from '../platform-access/platform-access-resolver.service';
import type {
  CredentialQueryParams,
  CreateCredentialDto,
  ExportCredentialsInput,
  UpdateCredentialDto,
} from './credential-domain.types';
import type { CredentialsAccessContext } from './credentials-access';
import { findAllCredentials } from './credentials-list.operations';
import { findRecentCredentials } from './credentials-recent.operations';
import {
  copyCredentialSecret,
  exportCredentialsBundle,
  recordCredentialUrlOpened,
  revealCredentialSecret,
} from './credentials-secrets.operations';
import { exportCredentialsEncryptedFile } from './credentials-export-file.operations';
import {
  listCredentialManualAccess,
  listCredentialSheetAudit,
  replaceCredentialManualAccess,
} from './credentials-manual-access.operations';
import {
  archiveCredential,
  createCredential,
  findCredentialById,
  permanentlyDeleteCredential,
  restoreCredential,
  updateCredential,
} from './credentials-mutation.operations';
import type { CredentialManualGrantInput } from './credential-manual-grant.types';
import type { CredentialsRuntime } from './credentials-runtime';

export type { CredentialsAccessContext } from './credentials-access';
export {
  CREDENTIAL_SECRET_FIELD_NAMES,
  type CredentialSecretsPresent,
} from './credential-domain.types';

@Injectable()
export class CredentialsService {
  private readonly runtime: CredentialsRuntime;

  constructor(
    @Inject(PRISMA_TOKEN) prisma: InstanceType<typeof PrismaClient>,
    configService: ConfigService,
    auditService: AuditService,
    notifications: NotificationService,
    platformAccessResolver: PlatformAccessResolverService,
  ) {
    const key = configService.get<string>('CREDENTIALS_ENCRYPTION_KEY');
    if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not configured');
    this.runtime = {
      prisma,
      encryptionKey: key,
      auditService,
      notifications,
      platformAccessResolver,
    };
  }

  findAll(params: CredentialQueryParams) {
    return findAllCredentials(this.runtime, params);
  }

  findRecent(access: CredentialsAccessContext) {
    return findRecentCredentials(this.runtime, access);
  }

  findById(id: string, access: CredentialsAccessContext) {
    return findCredentialById(this.runtime, id, access);
  }

  revealSecretField(
    id: string,
    field: string,
    stepUpPassword: string | undefined,
    access: CredentialsAccessContext,
  ) {
    return revealCredentialSecret(this.runtime, id, field, stepUpPassword, access);
  }

  copySecretField(
    id: string,
    field: string,
    stepUpPassword: string | undefined,
    access: CredentialsAccessContext,
  ) {
    return copyCredentialSecret(this.runtime, id, field, stepUpPassword, access);
  }

  exportCredentials(input: ExportCredentialsInput, access: CredentialsAccessContext) {
    return exportCredentialsBundle(this.runtime, input, access);
  }

  exportCredentialsFile(input: ExportCredentialsInput, access: CredentialsAccessContext) {
    return exportCredentialsEncryptedFile(this.runtime, input, access);
  }

  listManualAccess(id: string, access: CredentialsAccessContext) {
    return listCredentialManualAccess(this.runtime, id, access);
  }

  replaceManualAccess(
    id: string,
    grants: CredentialManualGrantInput[],
    access: CredentialsAccessContext,
  ) {
    return replaceCredentialManualAccess(this.runtime, id, grants, access);
  }

  listSheetAudit(id: string, access: CredentialsAccessContext, page?: number) {
    return listCredentialSheetAudit(this.runtime, id, access, page);
  }

  recordUrlOpened(id: string, access: CredentialsAccessContext) {
    return recordCredentialUrlOpened(this.runtime, id, access);
  }

  create(data: CreateCredentialDto, userId: string) {
    return createCredential(this.runtime, data, userId);
  }

  update(id: string, data: UpdateCredentialDto, access: CredentialsAccessContext) {
    return updateCredential(this.runtime, id, data, access);
  }

  archive(id: string, access: CredentialsAccessContext) {
    return archiveCredential(this.runtime, id, access);
  }

  restore(id: string, access: CredentialsAccessContext) {
    return restoreCredential(this.runtime, id, access);
  }

  permanentlyDelete(id: string, access: CredentialsAccessContext, stepUpPassword?: string) {
    return permanentlyDeleteCredential(this.runtime, id, access, stepUpPassword);
  }
}
