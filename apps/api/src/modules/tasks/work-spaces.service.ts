import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma, type WorkSpaceTypeEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  WORK_SPACES_LIST_DEFAULT_PAGE_SIZE,
  WORK_SPACES_LIST_MAX_PAGE_SIZE,
  WORK_SPACES_LIST_MIN_PAGE_SIZE,
} from './work-spaces-list.constants';
import { attachLegacyProductTasksToWorkSpace } from './task-workspace-legacy-attach.op';

interface WorkSpaceQueryParams {
  projectId?: string;
  productId?: string;
  extensionId?: string;
  type?: string;
}

export interface WorkSpaceListQueryParams extends WorkSpaceQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** `all` | `scrum` | `kanban` */
  mode?: string;
}

interface CreateWorkSpaceDto {
  name: string;
  type: string;
  projectId?: string;
  productId?: string;
  extensionId?: string;
  scrumEnabled?: boolean;
  description?: string;
}

interface UpdateWorkSpaceDto {
  name?: string;
  scrumEnabled?: boolean;
  description?: string | null;
}

const WORK_SPACE_INCLUDE = {
  project: { select: { id: true, code: true, name: true } },
  product: { select: { id: true, name: true, status: true } },
  extension: { select: { id: true, name: true, status: true } },
  _count: { select: { tasks: true } },
} satisfies Prisma.WorkSpaceInclude;

type WorkSpaceListRow = Prisma.WorkSpaceGetPayload<{ include: typeof WORK_SPACE_INCLUDE }>;

export interface WorkSpaceListPayload {
  items: WorkSpaceListRow[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
  counts: { standalone: number; product: number; total: number };
}

@Injectable()
export class WorkSpacesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: WorkSpaceListQueryParams): Promise<WorkSpaceListPayload> {
    const page = clampWorkSpaceListPage(params.page);
    const pageSize = clampWorkSpaceListPageSize(params.pageSize);
    const mode = parseWorkSpaceListMode(params.mode);

    const scopeWhere = await this.buildScopeWhere(params);
    const listWhere = applyWorkSpaceSearchModeAndType(scopeWhere, params.type, params.search, mode);

    const [items, total, standaloneCount, productCount] = await Promise.all([
      this.prisma.workSpace.findMany({
        where: listWhere,
        include: WORK_SPACE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.workSpace.count({ where: listWhere }),
      this.prisma.workSpace.count({
        where: { AND: [scopeWhere, { type: 'STANDALONE_OPERATIONAL' }] },
      }),
      this.prisma.workSpace.count({
        where: { AND: [scopeWhere, { type: 'PRODUCT_DELIVERY' }] },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
      counts: {
        standalone: standaloneCount,
        product: productCount,
        total: standaloneCount + productCount,
      },
    };
  }

  private async buildScopeWhere(params: WorkSpaceQueryParams): Promise<Prisma.WorkSpaceWhereInput> {
    const where: Prisma.WorkSpaceWhereInput = {};
    if (params.projectId) where.projectId = params.projectId;
    if (params.productId) where.productId = params.productId;
    if (params.extensionId) {
      const extension = await this.prisma.extension.findUnique({
        where: { id: params.extensionId },
        select: { productId: true },
      });
      if (!extension) throw new NotFoundException(`Extension ${params.extensionId} not found`);
      where.productId = extension.productId;
    }
    where.type = { not: 'EXTENSION_DELIVERY' };
    return where;
  }

  async findById(id: string) {
    const workspace = await this.prisma.workSpace.findUnique({
      where: { id },
      include: {
        ...WORK_SPACE_INCLUDE,
        tasks: { orderBy: { workspaceSortOrder: 'asc' }, take: 50 },
      },
    });
    if (!workspace) throw new NotFoundException(`Work Space ${id} not found`);
    return workspace;
  }

  /** Read-only lookup for product delivery workspace (does not create or run legacy attach). */
  async findByProductId(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const workspace = await this.prisma.workSpace.findUnique({
      where: { productId },
      include: WORK_SPACE_INCLUDE,
    });
    if (!workspace) {
      throw new NotFoundException(`Work Space for product ${productId} not found`);
    }
    return workspace;
  }

  async create(data: CreateWorkSpaceDto) {
    const type = parseWorkSpaceType(data.type);
    validateContext(type, data);
    return this.prisma.workSpace.create({
      data: {
        name: requireText(data.name, 'name'),
        type,
        projectId: data.projectId,
        productId: data.productId,
        extensionId: data.extensionId,
        scrumEnabled: data.scrumEnabled ?? type === 'PRODUCT_DELIVERY',
        description: data.description,
      },
      include: WORK_SPACE_INCLUDE,
    });
  }

  async ensureForProduct(productId: string) {
    const existing = await this.prisma.workSpace.findUnique({
      where: { productId },
      include: WORK_SPACE_INCLUDE,
    });
    if (existing) {
      await attachLegacyProductTasksToWorkSpace(this.prisma, existing.id, productId);
      return existing;
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, projectId: true, name: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const created = await this.prisma.workSpace.create({
      data: {
        projectId: product.projectId,
        productId: product.id,
        name: `${product.name} Work Space`,
        type: 'PRODUCT_DELIVERY',
        scrumEnabled: true,
      },
      include: WORK_SPACE_INCLUDE,
    });
    await attachLegacyProductTasksToWorkSpace(this.prisma, created.id, productId);
    return created;
  }

  async ensureForExtension(extensionId: string) {
    const extension = await this.prisma.extension.findUnique({
      where: { id: extensionId },
      select: { id: true, productId: true },
    });
    if (!extension) throw new NotFoundException(`Extension ${extensionId} not found`);
    return this.ensureForProduct(extension.productId);
  }

  async update(id: string, data: UpdateWorkSpaceDto) {
    await this.findById(id);
    return this.prisma.workSpace.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: requireText(data.name, 'name') }),
        ...(data.scrumEnabled !== undefined && { scrumEnabled: data.scrumEnabled }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: WORK_SPACE_INCLUDE,
    });
  }
}

function parseWorkSpaceType(type: string): WorkSpaceTypeEnum {
  if (['PRODUCT_DELIVERY', 'STANDALONE_OPERATIONAL'].includes(type)) {
    return type as WorkSpaceTypeEnum;
  }
  throw new BadRequestException(`Invalid Work Space type: ${type}`);
}

function validateContext(type: WorkSpaceTypeEnum, data: CreateWorkSpaceDto) {
  if (type === 'PRODUCT_DELIVERY' && !data.productId) {
    throw new BadRequestException('Product Work Space requires productId');
  }
  if (type === 'PRODUCT_DELIVERY' && data.extensionId) {
    throw new BadRequestException('Product Work Space cannot be linked to extensionId');
  }
  if (type === 'STANDALONE_OPERATIONAL' && (data.productId || data.extensionId)) {
    throw new BadRequestException('Standalone Work Space cannot be linked to Product or Extension');
  }
}

function requireText(value: string, field: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new BadRequestException(`${field} is required`);
  return trimmed;
}

function clampWorkSpaceListPage(page?: number): number {
  if (page === undefined || page === null || Number.isNaN(page) || page < 1) return 1;
  return Math.floor(page);
}

function clampWorkSpaceListPageSize(pageSize?: number): number {
  const raw =
    pageSize === undefined || pageSize === null || Number.isNaN(pageSize)
      ? WORK_SPACES_LIST_DEFAULT_PAGE_SIZE
      : Math.floor(pageSize);
  return Math.min(WORK_SPACES_LIST_MAX_PAGE_SIZE, Math.max(WORK_SPACES_LIST_MIN_PAGE_SIZE, raw));
}

function parseWorkSpaceListMode(mode?: string): 'all' | 'scrum' | 'kanban' {
  if (mode === 'scrum' || mode === 'kanban') return mode;
  return 'all';
}

function applyWorkSpaceSearchModeAndType(
  scope: Prisma.WorkSpaceWhereInput,
  typeFilter: string | undefined,
  search: string | undefined,
  mode: 'all' | 'scrum' | 'kanban',
): Prisma.WorkSpaceWhereInput {
  const parts: Prisma.WorkSpaceWhereInput[] = [scope];
  if (typeFilter) {
    parts.push({ type: parseWorkSpaceType(typeFilter) });
  }
  if (mode === 'scrum') parts.push({ scrumEnabled: true });
  if (mode === 'kanban') parts.push({ scrumEnabled: false });
  const trimmed = search?.trim();
  if (trimmed) {
    parts.push({
      OR: [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { description: { contains: trimmed, mode: 'insensitive' } },
        { project: { name: { contains: trimmed, mode: 'insensitive' } } },
        { project: { code: { contains: trimmed, mode: 'insensitive' } } },
        { product: { name: { contains: trimmed, mode: 'insensitive' } } },
        { extension: { name: { contains: trimmed, mode: 'insensitive' } } },
      ],
    });
  }
  return parts.length === 1 ? parts[0]! : { AND: parts };
}
