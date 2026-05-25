import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ChecklistTemplatesService } from './checklist-templates.service';

describe('ChecklistTemplatesService', () => {
  it('getVersionSnapshot throws when version is not on template', async () => {
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const prisma = {
      checklistTemplateVersion: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new ChecklistTemplatesService(prisma as never, audit as never);
    await expect(service.getVersionSnapshot('t1', 'v1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
