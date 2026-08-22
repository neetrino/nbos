import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AiAdminModelsController } from './ai-admin-models.controller';

describe('AiAdminModelsController', () => {
  it('returns 400 for an unknown status filter', () => {
    const catalog = { listAll: vi.fn() };
    const controller = new AiAdminModelsController(catalog as never, {} as never);
    expect(() => controller.list(undefined, 'NOPE')).toThrow(BadRequestException);
    expect(catalog.listAll).not.toHaveBeenCalled();
  });
});
