import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

const MY_PLAN = 'MY_PLAN' as const;

interface CreateMyPlanStageDto {
  title: string;
  color?: string;
  ownerId: string;
}

interface UpdateStageDto {
  title?: string;
  color?: string;
  sortOrder?: number;
}

@Injectable()
export class TaskBoardsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /** Получить стадии персонального плана (MY_PLAN) для пользователя */
  async getMyPlanStages(ownerId: string) {
    return this.prisma.taskBoardStage.findMany({
      where: { boardType: MY_PLAN, ownerId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createStage(data: CreateMyPlanStageDto) {
    const ownerId = data.ownerId?.trim();
    if (!ownerId) {
      throw new BadRequestException('MY_PLAN stages require a non-empty ownerId');
    }

    const maxOrder = await this.prisma.taskBoardStage.aggregate({
      where: {
        boardType: MY_PLAN,
        ownerId,
      },
      _max: { sortOrder: true },
    });

    return this.prisma.taskBoardStage.create({
      data: {
        boardType: MY_PLAN,
        title: data.title,
        color: data.color ?? '#3B82F6',
        ownerId,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async updateStage(id: string, data: UpdateStageDto) {
    const stage = await this.prisma.taskBoardStage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException(`Board stage ${id} not found`);
    if (stage.boardType !== MY_PLAN) {
      throw new BadRequestException('Only MY_PLAN stages can be updated');
    }
    return this.prisma.taskBoardStage.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.color && { color: data.color }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async deleteStage(id: string) {
    const stage = await this.prisma.taskBoardStage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException(`Board stage ${id} not found`);
    if (stage.boardType !== MY_PLAN) {
      throw new BadRequestException('Only MY_PLAN stages can be deleted');
    }
    return this.prisma.taskBoardStage.delete({ where: { id } });
  }

  /** Переупорядочить стадии */
  async reorderStages(stageIds: string[]) {
    for (const stageId of stageIds) {
      const stage = await this.prisma.taskBoardStage.findUnique({ where: { id: stageId } });
      if (!stage) throw new NotFoundException(`Board stage ${stageId} not found`);
      if (stage.boardType !== MY_PLAN) {
        throw new BadRequestException('Only MY_PLAN stages can be reordered');
      }
    }

    const updates = stageIds.map((stageId, index) =>
      this.prisma.taskBoardStage.update({
        where: { id: stageId },
        data: { sortOrder: index },
      }),
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }
}
