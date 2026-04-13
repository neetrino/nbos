import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

export interface SystemListOptionDto {
  id: string;
  listKey: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSystemListOptionDto {
  listKey: string;
  code: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateSystemListOptionDto {
  code?: string;
  label?: string;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class SystemListsService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  /** Get all distinct list keys (for admin UI) */
  async getListKeys(): Promise<{ listKey: string }[]> {
    const result = await this.prisma.systemListOption.findMany({
      select: { listKey: true },
      distinct: ['listKey'],
      orderBy: { listKey: 'asc' },
    });
    return result;
  }

  /** Get options for one list (for dropdowns). Only active by default. */
  async getOptionsByKey(
    listKey: string,
    options?: { includeInactive?: boolean },
  ): Promise<SystemListOptionDto[]> {
    const where: Prisma.SystemListOptionWhereInput = { listKey };
    if (!options?.includeInactive) {
      where.isActive = true;
    }
    const items = await this.prisma.systemListOption.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    return items.map(this.toDto);
  }

  /** Get all options, optionally grouped by listKey (for admin UI) */
  async getAllOptions(params?: {
    listKey?: string;
    includeInactive?: boolean;
  }): Promise<SystemListOptionDto[]> {
    const where: Prisma.SystemListOptionWhereInput = {};
    if (params?.listKey) where.listKey = params.listKey;
    if (!params?.includeInactive) where.isActive = true;

    const items = await this.prisma.systemListOption.findMany({
      where,
      orderBy: [{ listKey: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });
    return items.map(this.toDto);
  }

  /** Get one option by id */
  async getById(id: string): Promise<SystemListOptionDto> {
    const item = await this.prisma.systemListOption.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException(`System list option ${id} not found`);
    return this.toDto(item);
  }

  /** Create a new option */
  async create(data: CreateSystemListOptionDto): Promise<SystemListOptionDto> {
    if (!data.listKey?.trim()) {
      throw new BadRequestException('listKey is required');
    }
    if (!data.code?.trim()) {
      throw new BadRequestException('code is required');
    }
    if (!data.label?.trim()) {
      throw new BadRequestException('label is required');
    }
    const code = data.code.trim().toUpperCase().replace(/\s+/g, '_');
    const listKey = data.listKey.trim();

    const existing = await this.prisma.systemListOption.findUnique({
      where: { listKey_code: { listKey, code } },
    });
    if (existing) {
      throw new ConflictException(
        `Option with listKey "${listKey}" and code "${code}" already exists`,
      );
    }

    const maxOrder = await this.prisma.systemListOption
      .aggregate({
        where: { listKey },
        _max: { sortOrder: true },
      })
      .then((r) => r._max.sortOrder ?? -1);

    const item = await this.prisma.systemListOption.create({
      data: {
        listKey,
        code,
        label: data.label.trim(),
        sortOrder: data.sortOrder ?? maxOrder + 1,
        isActive: data.isActive ?? true,
      },
    });
    return this.toDto(item);
  }

  /** Update an option */
  async update(id: string, data: UpdateSystemListOptionDto): Promise<SystemListOptionDto> {
    await this.getById(id);

    const updateData: Prisma.SystemListOptionUpdateInput = {};
    if (data.code !== undefined) {
      updateData.code = data.code.trim().toUpperCase().replace(/\s+/g, '_');
    }
    if (data.label !== undefined) updateData.label = data.label.trim();
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const item = await this.prisma.systemListOption.update({
      where: { id },
      data: updateData,
    });
    return this.toDto(item);
  }

  /** Delete an option */
  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.prisma.systemListOption.delete({ where: { id } });
  }

  private toDto(row: Prisma.SystemListOptionGetPayload<object>): SystemListOptionDto {
    return {
      id: row.id,
      listKey: row.listKey,
      code: row.code,
      label: row.label,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
