import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { PlatformAccessResolverService } from '../platform-access/platform-access-resolver.service';
import { assertFreshCredentialStepUp } from './credential-vault-access';
import { CredentialVaultSessionService } from './credential-vault-session.service';
import type {
  CredentialQueryParams,
  CreateCredentialDto,
  ExportCredentialsInput,
  UpdateCredentialDto,
} from './credential-domain.types';
import type { CredentialsAccessContext } from './credentials-access';
import { findAllCredentials } from './credentials-list.operations';
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
import { grantCredentialEmergencyAccess } from './credentials-emergency-access.operations';
import {
  listCredentialSecretVersions,
  revealCredentialSecretVersion,
} from './credentials-secret-versions.operations';
import { bulkArchiveCredentials, bulkRestoreCredentials } from './credentials-bulk.operations';
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
import {
  createCredentialProvider,
  searchCredentialProviders,
} from './credential-providers.operations';

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
    vaultSession: CredentialVaultSessionService,
  ) {
    const key = configService.get<string>('CREDENTIALS_ENCRYPTION_KEY');
    if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not configured');
    this.runtime = {
      prisma,
      encryptionKey: key,
      auditService,
      notifications,
      platformAccessResolver,
      vaultSession,
    };
  }

  getVaultSession(employeeId: string) {
    return this.runtime.vaultSession.getSession(employeeId);
  }

  async unlockVault(employeeId: string, password: string) {
    await assertFreshCredentialStepUp(this.runtime, employeeId, password, 'vault_unlock');
    const session = await this.runtime.vaultSession.unlock(employeeId);
    await this.runtime.auditService.log({
      entityType: 'credential',
      entityId: employeeId,
      action: 'credential.vault_unlocked',
      userId: employeeId,
      changes: { expiresAt: session.expiresAt },
    });
    return session;
  }

  async lockVault(employeeId: string) {
    await this.runtime.vaultSession.lock(employeeId);
    await this.runtime.auditService.log({
      entityType: 'credential',
      entityId: employeeId,
      action: 'credential.vault_locked',
      userId: employeeId,
    });
    return { locked: true as const };
  }

  findAll(params: CredentialQueryParams, access: CredentialsAccessContext) {
    return findAllCredentials(this.runtime, params, access);
  }

  searchProviders(query?: string, limit?: number) {
    return searchCredentialProviders(this.runtime, query, limit);
  }

  createProvider(body: { name: string; website?: string }, userId: string) {
    return createCredentialProvider(this.runtime, body, userId);
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

  grantEmergencyAccess(
    id: string,
    input: { reason: string; stepUpPassword?: string },
    access: CredentialsAccessContext,
  ) {
    return grantCredentialEmergencyAccess(this.runtime, id, input, access);
  }

  listSecretVersions(id: string, access: CredentialsAccessContext) {
    return listCredentialSecretVersions(this.runtime, id, access);
  }

  revealSecretVersion(
    id: string,
    versionId: string,
    stepUpPassword: string | undefined,
    access: CredentialsAccessContext,
  ) {
    return revealCredentialSecretVersion(this.runtime, id, versionId, stepUpPassword, access);
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

  bulkArchive(credentialIds: string[], access: CredentialsAccessContext) {
    return bulkArchiveCredentials(this.runtime, access, credentialIds);
  }

  restore(id: string, access: CredentialsAccessContext) {
    return restoreCredential(this.runtime, id, access);
  }

  bulkRestore(credentialIds: string[], access: CredentialsAccessContext) {
    return bulkRestoreCredentials(this.runtime, access, credentialIds);
  }

  permanentlyDelete(id: string, access: CredentialsAccessContext, stepUpPassword?: string) {
    return permanentlyDeleteCredential(this.runtime, id, access, stepUpPassword);
  }
}
