import type { PrismaClient } from '@nbos/database';
import type { AuditService } from '../audit/audit.service';
import type { NotificationService } from '../notifications/notification.service';
import type { PlatformAccessResolverService } from '../platform-access/platform-access-resolver.service';
import type { CredentialVaultSessionService } from './credential-vault-session.service';

export interface CredentialsRuntime {
  prisma: InstanceType<typeof PrismaClient>;
  encryptionKey: string;
  auditService: AuditService;
  notifications: NotificationService;
  platformAccessResolver: PlatformAccessResolverService;
  vaultSession: CredentialVaultSessionService;
}
