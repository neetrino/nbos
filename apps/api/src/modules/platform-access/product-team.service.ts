import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { teamMemberEmployeeSelect } from './team-member.select';

@Injectable()
export class ProductTeamService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listByProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    return this.prisma.productTeamMember.findMany({
      where: { productId },
      include: { employee: { select: teamMemberEmployeeSelect } },
      orderBy: [{ isPrimary: 'desc' }, { slot: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
