import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface CreateStageDto {
  boardType: 'KANBAN' | 'MY_PLAN';
  title: string;
  color?: string;
  ownerId?: string;
}

interface UpdateStageDto {
  title?: string;
  color?: string;
  sortOrder?: number;
}

@Injectable()
export class TaskBoardsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  /** Получить стадии для общей доски (KANBAN) */
  async getKanbanStages() {
    return this.prisma.taskBoardStage.findMany({
      where: { boardType: 'KANBAN', ownerId: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Получить стадии персонального плана (MY_PLAN) для пользователя */
  async getMyPlanStages(ownerId: string) {
    return this.prisma.taskBoardStage.findMany({
      where: { boardType: 'MY_PLAN', ownerId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createStage(data: CreateStageDto) {
    const maxOrder = await this.prisma.taskBoardStage.aggregate({
      where: {
        boardType: data.boardType,
        ownerId: data.ownerId ?? null,
      },
      _max: { sortOrder: true },
    });

    return this.prisma.taskBoardStage.create({
      data: {
        boardType: data.boardType,
        title: data.title,
        color: data.color ?? '#3B82F6',
        ownerId: data.ownerId ?? null,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async updateStage(id: string, data: UpdateStageDto) {
    const stage = await this.prisma.taskBoardStage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException(`Board stage ${id} not found`);
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
    return this.prisma.taskBoardStage.delete({ where: { id } });
  }

  /** Переупорядочить стадии */
  async reorderStages(stageIds: string[]) {
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
