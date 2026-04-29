import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma, type WorkSpaceTypeEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface WorkSpaceQueryParams {
  projectId?: string;
  productId?: string;
  extensionId?: string;
  type?: string;
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

@Injectable()
export class WorkSpacesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: WorkSpaceQueryParams) {
    const where: Prisma.WorkSpaceWhereInput = {};
    if (params.projectId) where.projectId = params.projectId;
    if (params.productId) where.productId = params.productId;
    if (params.extensionId) where.extensionId = params.extensionId;
    if (params.type) where.type = parseWorkSpaceType(params.type);

    return this.prisma.workSpace.findMany({
      where,
      include: WORK_SPACE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
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
    if (existing) return existing;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, projectId: true, name: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    return this.prisma.workSpace.create({
      data: {
        projectId: product.projectId,
        productId: product.id,
        name: `${product.name} Work Space`,
        type: 'PRODUCT_DELIVERY',
        scrumEnabled: true,
      },
      include: WORK_SPACE_INCLUDE,
    });
  }

  async ensureForExtension(extensionId: string) {
    const existing = await this.prisma.workSpace.findUnique({
      where: { extensionId },
      include: WORK_SPACE_INCLUDE,
    });
    if (existing) return existing;

    const extension = await this.prisma.extension.findUnique({
      where: { id: extensionId },
      select: { id: true, projectId: true, name: true },
    });
    if (!extension) throw new NotFoundException(`Extension ${extensionId} not found`);

    return this.prisma.workSpace.create({
      data: {
        projectId: extension.projectId,
        extensionId: extension.id,
        name: `${extension.name} Work Space`,
        type: 'EXTENSION_DELIVERY',
      },
      include: WORK_SPACE_INCLUDE,
    });
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
  if (['PRODUCT_DELIVERY', 'EXTENSION_DELIVERY', 'STANDALONE_OPERATIONAL'].includes(type)) {
    return type as WorkSpaceTypeEnum;
  }
  throw new BadRequestException(`Invalid Work Space type: ${type}`);
}

function validateContext(type: WorkSpaceTypeEnum, data: CreateWorkSpaceDto) {
  if (type === 'PRODUCT_DELIVERY' && !data.productId) {
    throw new BadRequestException('Product Work Space requires productId');
  }
  if (type === 'EXTENSION_DELIVERY' && !data.extensionId) {
    throw new BadRequestException('Extension Work Space requires extensionId');
  }
}

function requireText(value: string, field: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new BadRequestException(`${field} is required`);
  return trimmed;
}
