import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, type Prisma } from '@nbos/database';
import * as argon2 from 'argon2';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { encrypt, decrypt } from '../../common/utils/crypto';
import {
  type CredentialsAccessContext,
  credentialsRbacBypassesRowFilter,
  resolveCredentialsRbacScope,
} from './credentials-access';
import {
  syncCredentialManualGrants,
  loadManualGrantCredentialIds,
} from './credential-manual-grants';
import {
  buildCredentialVisibilityOr,
  credentialVisibilityContextFromTeam,
  type CredentialVisibilityContext,
} from './credentials-visibility';
import { PlatformAccessResolverService } from '../platform-access/platform-access-resolver.service';

const SENSITIVE_FIELDS = ['password', 'apiKey', 'envData', 'secureNotes'] as const;
type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

export const CREDENTIAL_SECRET_FIELD_NAMES = SENSITIVE_FIELDS;

export interface CredentialSecretsPresent {
  password: boolean;
  apiKey: boolean;
  envData: boolean;
  secureNotes: boolean;
}

type CredentialHealthStatus = 'HEALTHY' | 'DUE_SOON' | 'OVERDUE' | 'UNKNOWN';

interface CredentialHealthMetadata {
  status: CredentialHealthStatus;
  dueInDays: number | null;
  flags: string[];
}

function isSensitiveField(value: string): value is SensitiveField {
  return (SENSITIVE_FIELDS as readonly string[]).includes(value);
}

const ALLOWED_CREDENTIAL_URL_PROTOCOLS = new Set(['http:', 'https:']);

function isSafeCredentialOpenUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return ALLOWED_CREDENTIAL_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

type CredentialTab = 'all' | 'personal' | 'department' | 'secret';

export type { CredentialsAccessContext } from './credentials-access';

interface CredentialQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  category?: string;
  accessLevel?: string;
  search?: string;
  tab?: CredentialTab;
  employeeId?: string;
  departmentIds?: string[];
  /** RBAC CREDENTIALS VIEW scope from the caller. */
  viewScope?: string;
  /** When true, list only archived rows (same visibility rules). */
  includeArchived?: boolean;
}

interface ExportCredentialsInput {
  credentialIds?: string[];
  fields?: string[];
  stepUpPassword?: string;
}

interface CreateCredentialDto {
  projectId?: string;
  productId?: string;
  domainId?: string;
  clientServiceRecordId?: string;
  departmentId?: string;
  ownerId?: string;
  category: string;
  credentialType?: string;
  criticality?: string;
  environment?: string;
  provider?: string;
  name: string;
  url?: string;
  login?: string;
  password?: string;
  apiKey?: string;
  envData?: string;
  phone?: string;
  notes?: string;
  publicNotes?: string;
  secureNotes?: string;
  lastRotatedAt?: string;
  nextRotationAt?: string;
  rotationOwnerId?: string;
  accessLevel?: string;
  allowedEmployees?: string[];
}

interface UpdateCredentialDto {
  projectId?: string;
  productId?: string;
  domainId?: string;
  clientServiceRecordId?: string;
  departmentId?: string;
  category?: string;
  credentialType?: string;
  criticality?: string;
  environment?: string;
  provider?: string;
  name?: string;
  url?: string;
  login?: string;
  password?: string;
  apiKey?: string;
  envData?: string;
  phone?: string;
  notes?: string;
  publicNotes?: string;
  secureNotes?: string;
  lastRotatedAt?: string | null;
  nextRotationAt?: string | null;
  rotationOwnerId?: string | null;
  accessLevel?: string;
  allowedEmployees?: string[];
}

function nullableDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === '') return null;
  return new Date(value);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysDiffUtc(from: Date, to: Date): number {
  const DAY = 24 * 60 * 60 * 1000;
  return Math.floor((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / DAY);
}

@Injectable()
export class CredentialsService {
  private readonly encryptionKey: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly notifications: NotificationService,
    private readonly platformAccessResolver: PlatformAccessResolverService,
  ) {
    const key = this.configService.get<string>('CREDENTIALS_ENCRYPTION_KEY');
    if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not configured');
    this.encryptionKey = key;
  }

  async findAll(params: CredentialQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      category,
      accessLevel,
      search,
      tab,
      employeeId,
      departmentIds = [],
      viewScope,
      includeArchived = false,
    } = params;

    const where: Prisma.CredentialWhereInput = {};

    if (includeArchived) {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

    if (projectId) where.projectId = projectId;
    if (category) where.category = category as Prisma.CredentialWhereInput['category'];
    if (accessLevel) where.accessLevel = accessLevel as Prisma.CredentialWhereInput['accessLevel'];
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
      ];
    }

    const visibilityCtx =
      employeeId && !credentialsRbacBypassesRowFilter(viewScope)
        ? await this.loadVisibilityContext({ employeeId, departmentIds })
        : undefined;

    if (tab && employeeId) {
      this.applyTabFilter(where, tab, employeeId, visibilityCtx, viewScope);
    } else if (visibilityCtx) {
      where.OR = [...(where.OR ?? []), ...buildCredentialVisibilityOr(visibilityCtx)];
    }

    const [rows, total] = await Promise.all([
      this.prisma.credential.findMany({
        where,
        select: {
          id: true,
          projectId: true,
          productId: true,
          domainId: true,
          clientServiceRecordId: true,
          departmentId: true,
          ownerId: true,
          category: true,
          credentialType: true,
          criticality: true,
          environment: true,
          provider: true,
          name: true,
          url: true,
          login: true,
          phone: true,
          accessLevel: true,
          allowedEmployees: true,
          publicNotes: true,
          lastRotatedAt: true,
          nextRotationAt: true,
          rotationOwnerId: true,
          createdAt: true,
          updatedAt: true,
          archivedAt: true,
          password: true,
          apiKey: true,
          envData: true,
          secureNotes: true,
          project: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.credential.count({ where }),
    ]);

    const items = rows.map((row) => this.toCredentialWithoutSecrets(row));

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /**
   * Tab-based filtering: shows only credentials matching the selected tab.
   */
  private applyTabFilter(
    where: Prisma.CredentialWhereInput,
    tab: CredentialTab,
    employeeId: string,
    visibilityCtx: CredentialVisibilityContext | undefined,
    viewScope?: string,
  ) {
    const rbacBypass = credentialsRbacBypassesRowFilter(viewScope);

    switch (tab) {
      case 'personal':
        where.accessLevel = 'PERSONAL';
        where.ownerId = employeeId;
        break;
      case 'department':
        where.accessLevel = 'DEPARTMENT';
        if (!rbacBypass && visibilityCtx && visibilityCtx.departmentIds.length > 0) {
          where.departmentId = { in: visibilityCtx.departmentIds };
        }
        break;
      case 'secret': {
        where.accessLevel = 'SECRET';
        if (!rbacBypass && visibilityCtx) {
          const secretBranch = buildCredentialVisibilityOr(visibilityCtx).find(
            (b) => 'accessLevel' in b && b.accessLevel === 'SECRET',
          );
          if (secretBranch?.OR) where.OR = secretBranch.OR;
        }
        break;
      }
      case 'all':
      default:
        if (!rbacBypass && visibilityCtx) {
          where.OR = [...(where.OR ?? []), ...buildCredentialVisibilityOr(visibilityCtx)];
        }
        break;
    }
  }

  private async loadVisibilityContext(
    access: Pick<CredentialsAccessContext, 'employeeId' | 'departmentIds'>,
  ): Promise<CredentialVisibilityContext> {
    const [team, manualGrantCredentialIds] = await Promise.all([
      this.platformAccessResolver.loadTeamContext(access.employeeId),
      loadManualGrantCredentialIds(this.prisma, access.employeeId),
    ]);
    return credentialVisibilityContextFromTeam(
      access.employeeId,
      access.departmentIds,
      team,
      manualGrantCredentialIds,
    );
  }

  private async rowVisibilityWhere(
    access: CredentialsAccessContext,
    action: 'view' | 'edit' | 'delete' = 'view',
  ): Promise<Pick<Prisma.CredentialWhereInput, 'OR'>> {
    const scope = resolveCredentialsRbacScope(access, action);
    if (credentialsRbacBypassesRowFilter(scope)) return {};
    const ctx = await this.loadVisibilityContext(access);
    return { OR: buildCredentialVisibilityOr(ctx) };
  }

  async findById(id: string, access: CredentialsAccessContext) {
    const credential = await this.prisma.credential.findFirst({
      where: {
        id,
        archivedAt: null,
        ...(await this.rowVisibilityWhere(access, 'view')),
      },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!credential) throw new NotFoundException(`Credential ${id} not found`);

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.view',
      userId: access.employeeId,
      projectId: credential.projectId ?? undefined,
    });

    return this.toCredentialWithoutSecrets(credential);
  }

  /**
   * Returns one decrypted secret; audit `credential.secret_revealed` (no plaintext in audit payload).
   */
  async revealSecretField(
    id: string,
    field: string,
    stepUpPassword: string | undefined,
    access: CredentialsAccessContext,
  ) {
    const secretField = this.parseSecretField(field);
    await this.assertStepUpPassword(access.employeeId, stepUpPassword, `reveal:${secretField}`);
    const row = await this.getAccessibleCredentialRow(id, access);
    const raw = row[secretField];
    if (!raw || typeof raw !== 'string') {
      throw new BadRequestException(`Credential has no ${secretField} value`);
    }
    const value = this.decryptFieldIfEncrypted(raw);

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.secret_revealed',
      userId: access.employeeId,
      projectId: row.projectId ?? undefined,
      changes: [secretField],
    });
    await this.notifyHighRiskIfNeeded(row, access.employeeId, 'reveal', secretField);

    return { field: secretField, value };
  }

  /**
   * Returns one decrypted secret; audit `credential.secret_copied` (client should call when user copies).
   */
  async copySecretField(
    id: string,
    field: string,
    stepUpPassword: string | undefined,
    access: CredentialsAccessContext,
  ) {
    const secretField = this.parseSecretField(field);
    await this.assertStepUpPassword(access.employeeId, stepUpPassword, `copy:${secretField}`);
    const row = await this.getAccessibleCredentialRow(id, access);
    const raw = row[secretField];
    if (!raw || typeof raw !== 'string') {
      throw new BadRequestException(`Credential has no ${secretField} value`);
    }
    const value = this.decryptFieldIfEncrypted(raw);

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.secret_copied',
      userId: access.employeeId,
      projectId: row.projectId ?? undefined,
      changes: [secretField],
    });
    await this.notifyHighRiskIfNeeded(row, access.employeeId, 'copy', secretField);

    return { field: secretField, value };
  }

  async exportCredentials(input: ExportCredentialsInput, access: CredentialsAccessContext) {
    await this.assertStepUpPassword(access.employeeId, input.stepUpPassword, 'export');
    const requestedFields = input.fields?.length ? input.fields : [...SENSITIVE_FIELDS];
    const fields = requestedFields.map((f) => this.parseSecretField(f));

    const where: Prisma.CredentialWhereInput = {
      archivedAt: null,
      ...(await this.rowVisibilityWhere(access, 'view')),
    };
    if (input.credentialIds && input.credentialIds.length > 0) {
      where.id = { in: input.credentialIds };
    }

    const rows = await this.prisma.credential.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        credentialType: true,
        criticality: true,
        accessLevel: true,
        ownerId: true,
        projectId: true,
        password: true,
        apiKey: true,
        envData: true,
        secureNotes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const exported = rows.map((row) => {
      const secrets: Partial<Record<SensitiveField, string>> = {};
      for (const field of fields) {
        const raw = row[field];
        if (typeof raw === 'string' && raw.length > 0) {
          secrets[field] = this.decryptFieldIfEncrypted(raw);
        }
      }
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        credentialType: row.credentialType,
        criticality: row.criticality,
        accessLevel: row.accessLevel,
        projectId: row.projectId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        secrets,
      };
    });

    await this.auditService.log({
      entityType: 'credential',
      entityId: 'bulk_export',
      action: 'credential.exported',
      userId: access.employeeId,
      changes: {
        count: exported.length,
        fields,
      },
    });
    await this.notifyCredentialHighRiskRecipients({
      actorId: access.employeeId,
      title: 'Credentials export performed',
      body: `A credentials export was completed (${exported.length} records).`,
      entityId: 'bulk_export',
      dedupeSuffix: `${access.employeeId}:${exported.length}`,
    });

    return {
      exportedAt: new Date().toISOString(),
      count: exported.length,
      fields,
      items: exported,
    };
  }

  /**
   * Validates row access and http(s) URL, logs `credential.url_opened`, returns URL for client navigation.
   */
  async recordUrlOpened(id: string, access: CredentialsAccessContext) {
    const row = await this.getAccessibleCredentialRow(id, access);
    const url = typeof row.url === 'string' ? row.url.trim() : '';
    if (!url || !isSafeCredentialOpenUrl(url)) {
      throw new BadRequestException('Credential has no safe http(s) URL to open');
    }

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.url_opened',
      userId: access.employeeId,
      projectId: row.projectId ?? undefined,
    });

    return { url };
  }

  async create(data: CreateCredentialDto, userId: string) {
    const encrypted = this.encryptSensitive(data);

    const credential = await this.prisma.credential.create({
      data: {
        projectId: data.projectId,
        productId: data.productId,
        domainId: data.domainId,
        clientServiceRecordId: data.clientServiceRecordId,
        departmentId: data.departmentId,
        ownerId: data.ownerId,
        category: data.category as Prisma.CredentialCreateInput['category'],
        credentialType:
          (data.credentialType as Prisma.CredentialCreateInput['credentialType']) ??
          'LOGIN_PASSWORD',
        criticality: (data.criticality as Prisma.CredentialCreateInput['criticality']) ?? 'MEDIUM',
        environment: data.environment,
        provider: data.provider,
        name: data.name,
        url: data.url,
        login: data.login,
        password: encrypted.password,
        apiKey: encrypted.apiKey,
        envData: encrypted.envData,
        phone: data.phone,
        notes: data.publicNotes ?? data.notes,
        publicNotes: data.publicNotes ?? data.notes,
        secureNotes: encrypted.secureNotes,
        lastRotatedAt: nullableDate(data.lastRotatedAt),
        nextRotationAt: nullableDate(data.nextRotationAt),
        rotationOwnerId: data.rotationOwnerId,
        accessLevel:
          (data.accessLevel as Prisma.CredentialCreateInput['accessLevel']) ?? 'PROJECT_TEAM',
        allowedEmployees: data.allowedEmployees ?? [],
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await this.auditService.log({
      entityType: 'credential',
      entityId: credential.id,
      action: 'credential.create',
      userId,
      projectId: credential.projectId ?? undefined,
    });

    if (credential.accessLevel === 'SECRET' && credential.allowedEmployees.length > 0) {
      await syncCredentialManualGrants(
        this.prisma,
        credential.id,
        credential.allowedEmployees,
        userId,
      );
    }

    return this.toCredentialWithoutSecrets(credential);
  }

  async update(id: string, data: UpdateCredentialDto, access: CredentialsAccessContext) {
    const existing = await this.prisma.credential.findFirst({
      where: {
        id,
        archivedAt: null,
        ...(await this.rowVisibilityWhere(access, 'edit')),
      },
    });
    if (!existing) throw new NotFoundException(`Credential ${id} not found`);

    const encrypted = this.encryptSensitive(data);
    const changedFields = this.detectChangedFields(data, existing);

    const credential = await this.prisma.credential.update({
      where: { id },
      data: {
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.productId !== undefined && { productId: data.productId }),
        ...(data.domainId !== undefined && { domainId: data.domainId }),
        ...(data.clientServiceRecordId !== undefined && {
          clientServiceRecordId: data.clientServiceRecordId,
        }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.category && {
          category: data.category as Prisma.CredentialUpdateInput['category'],
        }),
        ...(data.credentialType && {
          credentialType: data.credentialType as Prisma.CredentialUpdateInput['credentialType'],
        }),
        ...(data.criticality && {
          criticality: data.criticality as Prisma.CredentialUpdateInput['criticality'],
        }),
        ...(data.environment !== undefined && { environment: data.environment }),
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.name && { name: data.name }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.login !== undefined && { login: data.login }),
        ...(data.password !== undefined && { password: encrypted.password }),
        ...(data.apiKey !== undefined && { apiKey: encrypted.apiKey }),
        ...(data.envData !== undefined && { envData: encrypted.envData }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.notes !== undefined && { notes: data.notes, publicNotes: data.notes }),
        ...(data.publicNotes !== undefined && {
          notes: data.publicNotes,
          publicNotes: data.publicNotes,
        }),
        ...(data.secureNotes !== undefined && { secureNotes: encrypted.secureNotes }),
        ...(data.lastRotatedAt !== undefined && {
          lastRotatedAt: nullableDate(data.lastRotatedAt),
        }),
        ...(data.nextRotationAt !== undefined && {
          nextRotationAt: nullableDate(data.nextRotationAt),
        }),
        ...(data.rotationOwnerId !== undefined && { rotationOwnerId: data.rotationOwnerId }),
        ...(data.accessLevel && {
          accessLevel: data.accessLevel as Prisma.CredentialUpdateInput['accessLevel'],
        }),
        ...(data.allowedEmployees && { allowedEmployees: data.allowedEmployees }),
      },
      include: { project: { select: { id: true, name: true } } },
    });

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.update',
      userId: access.employeeId,
      projectId: credential.projectId ?? undefined,
      changes: changedFields,
    });

    if (
      credential.accessLevel === 'SECRET' &&
      (data.allowedEmployees !== undefined || data.accessLevel === 'SECRET')
    ) {
      await syncCredentialManualGrants(
        this.prisma,
        credential.id,
        credential.allowedEmployees,
        access.employeeId,
      );
    }

    return this.toCredentialWithoutSecrets(credential);
  }

  async archive(id: string, access: CredentialsAccessContext) {
    const existing = await this.prisma.credential.findFirst({
      where: {
        id,
        archivedAt: null,
        ...(await this.rowVisibilityWhere(access, 'delete')),
      },
    });
    if (!existing) throw new NotFoundException(`Credential ${id} not found`);

    const archivedAt = new Date();
    await this.prisma.credential.update({
      where: { id },
      data: { archivedAt },
    });

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.archived',
      userId: access.employeeId,
      projectId: existing.projectId ?? undefined,
    });
  }

  async restore(id: string, access: CredentialsAccessContext) {
    const existing = await this.prisma.credential.findFirst({
      where: {
        id,
        archivedAt: { not: null },
        ...(await this.rowVisibilityWhere(access, 'edit')),
      },
    });
    if (!existing) throw new NotFoundException(`Credential ${id} not found`);

    await this.prisma.credential.update({
      where: { id },
      data: { archivedAt: null },
    });

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.restored',
      userId: access.employeeId,
      projectId: existing.projectId ?? undefined,
    });
  }

  /**
   * Physical row removal; only allowed when the credential is already archived.
   */
  async permanentlyDelete(id: string, access: CredentialsAccessContext) {
    const existing = await this.prisma.credential.findFirst({
      where: {
        id,
        archivedAt: { not: null },
        ...(await this.rowVisibilityWhere(access, 'delete')),
      },
    });
    if (!existing) throw new NotFoundException(`Credential ${id} not found`);

    await this.prisma.credential.delete({ where: { id } });

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.permanently_deleted',
      userId: access.employeeId,
      projectId: existing.projectId ?? undefined,
    });
  }

  private encryptSensitive(data: Partial<Record<SensitiveField, string | undefined | null>>) {
    const result: Record<string, string | undefined | null> = {};
    for (const field of SENSITIVE_FIELDS) {
      const value = data[field];
      result[field] = value ? encrypt(value, this.encryptionKey) : value;
    }
    return result;
  }

  private parseSecretField(field: string): SensitiveField {
    if (!isSensitiveField(field)) {
      throw new BadRequestException(
        `Invalid secret field; allowed: ${SENSITIVE_FIELDS.join(', ')}`,
      );
    }
    return field;
  }

  private async assertStepUpPassword(
    employeeId: string,
    stepUpPassword: string | undefined,
    purpose: string,
  ) {
    const password = stepUpPassword?.trim();
    if (!password) {
      throw new BadRequestException('stepUpPassword is required for high-risk action');
    }
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { passwordHash: true },
    });
    if (!employee?.passwordHash) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    const ok = await argon2.verify(employee.passwordHash, password);
    if (!ok) {
      throw new BadRequestException('Invalid step-up password');
    }
    await this.auditService.log({
      entityType: 'credential',
      entityId: employeeId,
      action: 'credential.step_up_verified',
      userId: employeeId,
      changes: { purpose },
    });
  }

  private async notifyHighRiskIfNeeded(
    row: { id: string; name?: string | null; ownerId?: string | null; criticality?: string | null },
    actorId: string,
    action: 'reveal' | 'copy',
    field: SensitiveField,
  ) {
    const isHighRisk = row.criticality === 'HIGH' || row.criticality === 'CRITICAL';
    if (!isHighRisk) return;
    await this.notifyCredentialHighRiskRecipients({
      actorId,
      title: 'High-risk credential action',
      body: `${action.toUpperCase()} on ${field} for credential ${row.name ?? row.id}.`,
      entityId: row.id,
      ownerId: row.ownerId ?? null,
      dedupeSuffix: `${action}:${field}:${row.id}:${actorId}`,
    });
  }

  private async notifyCredentialHighRiskRecipients(params: {
    actorId: string;
    title: string;
    body: string;
    entityId: string;
    ownerId?: string | null;
    dedupeSuffix: string;
  }) {
    const recipients = new Set<string>();
    if (params.ownerId) recipients.add(params.ownerId);

    const admins = await this.prisma.employee.findMany({
      where: {
        role: { slug: { in: ['ceo', 'admin'] } },
      },
      select: { id: true },
    });
    for (const admin of admins) recipients.add(admin.id);
    recipients.delete(params.actorId);

    await Promise.all(
      [...recipients].map((recipientId) =>
        this.notifications.create({
          type: 'credentials.high_risk_action',
          recipientId,
          title: params.title,
          body: params.body,
          entityType: 'credential',
          entityId: params.entityId,
          sourceModule: 'credentials',
          dedupeKey: `credentials.high_risk_action:${recipientId}:${params.dedupeSuffix}`,
        }),
      ),
    );
  }

  private async getAccessibleCredentialRow(id: string, access: CredentialsAccessContext) {
    const row = await this.prisma.credential.findFirst({
      where: {
        id,
        archivedAt: null,
        ...(await this.rowVisibilityWhere(access, 'view')),
      },
    });
    if (!row) throw new NotFoundException(`Credential ${id} not found`);
    return row;
  }

  private decryptFieldIfEncrypted(stored: string): string {
    if (typeof stored === 'string' && stored.includes(':')) {
      return decrypt(stored, this.encryptionKey);
    }
    return stored;
  }

  private toCredentialWithoutSecrets(credential: Record<string, unknown>) {
    const { password, apiKey, envData, secureNotes, ...rest } = credential;
    const nextRotationAt =
      credential.nextRotationAt instanceof Date ? credential.nextRotationAt : null;
    const now = new Date();
    const dueInDays = nextRotationAt ? daysDiffUtc(now, nextRotationAt) : null;
    let status: CredentialHealthStatus = 'UNKNOWN';
    if (dueInDays !== null) {
      if (dueInDays < 0) status = 'OVERDUE';
      else if (dueInDays <= 14) status = 'DUE_SOON';
      else status = 'HEALTHY';
    }
    const flags: string[] = [];
    const criticality = typeof credential.criticality === 'string' ? credential.criticality : null;
    const accessLevel = typeof credential.accessLevel === 'string' ? credential.accessLevel : null;
    const ownerId = typeof credential.ownerId === 'string' ? credential.ownerId : null;
    if ((criticality === 'HIGH' || criticality === 'CRITICAL') && !ownerId) {
      flags.push('MISSING_OWNER');
    }
    if ((criticality === 'HIGH' || criticality === 'CRITICAL') && accessLevel === 'ALL') {
      flags.push('BROAD_ACCESS');
    }

    return {
      ...rest,
      secretsPresent: {
        password: typeof password === 'string' && password.length > 0,
        apiKey: typeof apiKey === 'string' && apiKey.length > 0,
        envData: typeof envData === 'string' && envData.length > 0,
        secureNotes: typeof secureNotes === 'string' && secureNotes.length > 0,
      } satisfies CredentialSecretsPresent,
      health: {
        status,
        dueInDays,
        flags,
      } satisfies CredentialHealthMetadata,
    };
  }

  private detectChangedFields(
    data: UpdateCredentialDto,
    existing: Record<string, unknown>,
  ): string[] {
    return Object.keys(data).filter((key) => {
      const newVal = data[key as keyof UpdateCredentialDto];
      return newVal !== undefined && newVal !== existing[key];
    });
  }
}
