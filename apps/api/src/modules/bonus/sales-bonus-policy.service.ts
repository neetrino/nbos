import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

export interface UpdateSalesBonusPolicyDto {
  sellerPercent?: number;
  assistantPercent?: number;
  isActive?: boolean;
}

@Injectable()
export class SalesBonusPolicyService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listAll() {
    return this.prisma.salesBonusPolicy.findMany({
      orderBy: [{ fromCategory: 'asc' }, { paymentModel: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  async update(id: string, data: UpdateSalesBonusPolicyDto) {
    const row = await this.prisma.salesBonusPolicy.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Sales bonus policy ${id} not found`);
    }
    if (data.sellerPercent !== undefined) {
      if (
        !Number.isFinite(data.sellerPercent) ||
        data.sellerPercent < 0 ||
        data.sellerPercent > 100
      ) {
        throw new BadRequestException('sellerPercent must be between 0 and 100');
      }
    }
    if (data.assistantPercent !== undefined) {
      if (
        !Number.isFinite(data.assistantPercent) ||
        data.assistantPercent < 0 ||
        data.assistantPercent > 100
      ) {
        throw new BadRequestException('assistantPercent must be between 0 and 100');
      }
    }
    return this.prisma.salesBonusPolicy.update({
      where: { id },
      data: {
        ...(data.sellerPercent !== undefined && { sellerPercent: data.sellerPercent }),
        ...(data.assistantPercent !== undefined && { assistantPercent: data.assistantPercent }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }
}
