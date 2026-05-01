import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  MAX_KICKOFF_CHECKLIST_NOTE_LENGTH,
  PROJECT_KICKOFF_CHECKLIST_ITEMS,
} from './project-kickoff-checklist.constants';

export interface UpdateKickoffChecklistItemDto {
  isChecked?: boolean;
  note?: string | null;
}

@Injectable()
export class ProjectKickoffChecklistService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async ensureForProject(projectId: string) {
    const existing = await this.findForProject(projectId);
    const existingKeys = new Set(existing.map((item) => item.key));
    const missing = PROJECT_KICKOFF_CHECKLIST_ITEMS.filter((item) => !existingKeys.has(item.key));

    if (missing.length === 0) return existing;

    await Promise.all(
      missing.map((item) =>
        this.prisma.projectKickoffChecklistItem.create({
          data: {
            projectId,
            key: item.key,
            title: item.title,
            isRequired: item.isRequired,
            sortOrder: item.sortOrder,
          },
        }),
      ),
    );

    return this.findForProject(projectId);
  }

  async updateItem(projectId: string, itemId: string, data: UpdateKickoffChecklistItemDto) {
    this.validateUpdate(data);
    const item = await this.prisma.projectKickoffChecklistItem.findFirst({
      where: { id: itemId, projectId },
    });
    if (!item) throw new NotFoundException(`Kickoff checklist item ${itemId} not found`);

    return this.prisma.projectKickoffChecklistItem.update({
      where: { id: itemId },
      data: this.toUpdateData(data),
    });
  }

  private findForProject(projectId: string) {
    return this.prisma.projectKickoffChecklistItem.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private validateUpdate(data: UpdateKickoffChecklistItemDto) {
    if (data.isChecked === undefined && data.note === undefined) {
      throw new BadRequestException('Checklist update payload is empty');
    }
    if (data.note && data.note.length > MAX_KICKOFF_CHECKLIST_NOTE_LENGTH) {
      throw new BadRequestException('Checklist note is too long');
    }
  }

  private toUpdateData(data: UpdateKickoffChecklistItemDto) {
    return {
      ...(data.isChecked !== undefined && {
        isChecked: data.isChecked,
        checkedAt: data.isChecked ? new Date() : null,
        checkedById: null,
      }),
      ...(data.note !== undefined && { note: data.note }),
    };
  }
}
