import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

@Injectable()
export class RolesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { level: 'asc' },
      include: {
        _count: { select: { employees: true } },
      },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async create(data: { name: string; slug: string; description?: string; level: number }) {
    return this.prisma.role.create({
      data: {
        ...data,
        isSystem: false,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; description?: string; level?: number },
  ) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    if (role.isSystem) {
      throw new BadRequestException('Cannot update system role');
    }
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async updatePermissions(
    roleId: string,
    permissions: Array<{ permissionId: string; scope: string }>,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId,
          permissionId: p.permissionId,
          scope: p.scope,
        })),
      }),
    ]);

    return this.findById(roleId);
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }
    if (role._count.employees > 0) {
      throw new BadRequestException('Cannot delete role with assigned employees');
    }
    return this.prisma.role.delete({ where: { id } });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }
}
