import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import { encrypt, decrypt } from '../../common/utils/crypto';

const SENSITIVE_FIELDS = ['password', 'apiKey', 'envData'] as const;
type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

export const CREDENTIAL_SECRET_FIELD_NAMES = SENSITIVE_FIELDS;

export interface CredentialSecretsPresent {
  password: boolean;
  apiKey: boolean;
  envData: boolean;
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

/** Caller identity for row-level credential access (mirrors list visibility rules). */
export interface CredentialsAccessContext {
  employeeId: string;
  departmentIds: string[];
}

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
}

interface CreateCredentialDto {
  projectId?: string;
  departmentId?: string;
  ownerId?: string;
  category: string;
  provider?: string;
  name: string;
  url?: string;
  login?: string;
  password?: string;
  apiKey?: string;
  envData?: string;
  phone?: string;
  notes?: string;
  accessLevel?: string;
  allowedEmployees?: string[];
}

interface UpdateCredentialDto {
  projectId?: string;
  departmentId?: string;
  category?: string;
  provider?: string;
  name?: string;
  url?: string;
  login?: string;
  password?: string;
  apiKey?: string;
  envData?: string;
  phone?: string;
  notes?: string;
  accessLevel?: string;
  allowedEmployees?: string[];
}

@Injectable()
export class CredentialsService {
  private readonly encryptionKey: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
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
    } = params;

    const where: Prisma.CredentialWhereInput = {};

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

    if (tab && employeeId) {
      this.applyTabFilter(where, tab, employeeId, departmentIds);
    } else if (employeeId) {
      this.applyVisibilityFilter(where, employeeId, departmentIds);
    }

    const [rows, total] = await Promise.all([
      this.prisma.credential.findMany({
        where,
        select: {
          id: true,
          projectId: true,
          departmentId: true,
          ownerId: true,
          category: true,
          provider: true,
          name: true,
          url: true,
          login: true,
          phone: true,
          accessLevel: true,
          allowedEmployees: true,
          createdAt: true,
          updatedAt: true,
          password: true,
          apiKey: true,
          envData: true,
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
    departmentIds: string[],
  ) {
    switch (tab) {
      case 'personal':
        where.accessLevel = 'PERSONAL';
        where.ownerId = employeeId;
        break;
      case 'department':
        where.accessLevel = 'DEPARTMENT';
        if (departmentIds.length > 0) {
          where.departmentId = { in: departmentIds };
        }
        break;
      case 'secret':
        where.accessLevel = 'SECRET';
        where.allowedEmployees = { has: employeeId };
        break;
      case 'all':
      default:
        this.applyVisibilityFilter(where, employeeId, departmentIds);
        break;
    }
  }

  /**
   * General visibility: user sees credentials they have access to.
   * - ALL → everyone
   * - PERSONAL → only owner
   * - DEPARTMENT → same department
   * - PROJECT_TEAM → same project team (via project membership)
   * - SECRET → only allowedEmployees
   */
  private applyVisibilityFilter(
    where: Prisma.CredentialWhereInput,
    employeeId: string,
    departmentIds: string[],
  ) {
    where.OR = [...(where.OR ?? []), ...this.visibilityAccessOr(employeeId, departmentIds)];
  }

  /** Same rules as list `applyVisibilityFilter` OR branch, for single-row guards. */
  private visibilityAccessOr(
    employeeId: string,
    departmentIds: string[],
  ): Prisma.CredentialWhereInput[] {
    return [
      { accessLevel: 'ALL' },
      { accessLevel: 'PERSONAL', ownerId: employeeId },
      ...(departmentIds.length > 0
        ? [{ accessLevel: 'DEPARTMENT' as const, departmentId: { in: departmentIds } }]
        : []),
      {
        accessLevel: 'PROJECT_TEAM',
        project: {
          OR: [
            { products: { some: { pmId: employeeId } } },
            { extensions: { some: { assignedTo: employeeId } } },
            {
              orders: {
                some: {
                  deal: {
                    OR: [{ sellerId: employeeId }, { pmId: employeeId }],
                  },
                },
              },
            },
          ],
        },
      },
      { accessLevel: 'SECRET', allowedEmployees: { has: employeeId } },
    ];
  }

  async findById(id: string, access: CredentialsAccessContext) {
    const credential = await this.prisma.credential.findFirst({
      where: {
        id,
        OR: this.visibilityAccessOr(access.employeeId, access.departmentIds),
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
  async revealSecretField(id: string, field: string, access: CredentialsAccessContext) {
    const secretField = this.parseSecretField(field);
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

    return { field: secretField, value };
  }

  /**
   * Returns one decrypted secret; audit `credential.secret_copied` (client should call when user copies).
   */
  async copySecretField(id: string, field: string, access: CredentialsAccessContext) {
    const secretField = this.parseSecretField(field);
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

    return { field: secretField, value };
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
        departmentId: data.departmentId,
        ownerId: data.ownerId,
        category: data.category as Prisma.CredentialCreateInput['category'],
        provider: data.provider,
        name: data.name,
        url: data.url,
        login: data.login,
        password: encrypted.password,
        apiKey: encrypted.apiKey,
        envData: encrypted.envData,
        phone: data.phone,
        notes: data.notes,
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

    return this.toCredentialWithoutSecrets(credential);
  }

  async update(id: string, data: UpdateCredentialDto, access: CredentialsAccessContext) {
    const existing = await this.prisma.credential.findFirst({
      where: {
        id,
        OR: this.visibilityAccessOr(access.employeeId, access.departmentIds),
      },
    });
    if (!existing) throw new NotFoundException(`Credential ${id} not found`);

    const encrypted = this.encryptSensitive(data);
    const changedFields = this.detectChangedFields(data, existing);

    const credential = await this.prisma.credential.update({
      where: { id },
      data: {
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.category && {
          category: data.category as Prisma.CredentialUpdateInput['category'],
        }),
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.name && { name: data.name }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.login !== undefined && { login: data.login }),
        ...(data.password !== undefined && { password: encrypted.password }),
        ...(data.apiKey !== undefined && { apiKey: encrypted.apiKey }),
        ...(data.envData !== undefined && { envData: encrypted.envData }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.notes !== undefined && { notes: data.notes }),
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

    return this.toCredentialWithoutSecrets(credential);
  }

  async delete(id: string, access: CredentialsAccessContext) {
    const existing = await this.prisma.credential.findFirst({
      where: {
        id,
        OR: this.visibilityAccessOr(access.employeeId, access.departmentIds),
      },
    });
    if (!existing) throw new NotFoundException(`Credential ${id} not found`);

    await this.prisma.credential.delete({ where: { id } });

    await this.auditService.log({
      entityType: 'credential',
      entityId: id,
      action: 'credential.delete',
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

  private async getAccessibleCredentialRow(id: string, access: CredentialsAccessContext) {
    const row = await this.prisma.credential.findFirst({
      where: {
        id,
        OR: this.visibilityAccessOr(access.employeeId, access.departmentIds),
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
    const { password, apiKey, envData, ...rest } = credential;
    return {
      ...rest,
      secretsPresent: {
        password: typeof password === 'string' && password.length > 0,
        apiKey: typeof apiKey === 'string' && apiKey.length > 0,
        envData: typeof envData === 'string' && envData.length > 0,
      } satisfies CredentialSecretsPresent,
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
