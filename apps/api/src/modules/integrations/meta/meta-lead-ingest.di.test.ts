import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { PRISMA_TOKEN } from '../../../database.module';
import { MetaLeadIngestService } from './meta-lead-ingest.service';
import { MetaProfileService } from './meta-profile.service';

describe('MetaLeadIngestService Nest DI', () => {
  it('resolves MetaProfileService using the class injection token', async () => {
    const profileService = {
      resolveSenderProfile: vi.fn(),
    };

    const testingModule = await Test.createTestingModule({
      providers: [
        MetaLeadIngestService,
        { provide: PRISMA_TOKEN, useValue: {} },
        { provide: MetaProfileService, useValue: profileService },
      ],
    }).compile();

    const service = testingModule.get(MetaLeadIngestService);
    expect(service).toBeInstanceOf(MetaLeadIngestService);

    const paramTypes = Reflect.getMetadata('design:paramtypes', MetaLeadIngestService) as unknown[];
    expect(paramTypes[1]).toBe(MetaProfileService);
  });
});
