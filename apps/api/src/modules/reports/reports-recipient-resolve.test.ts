import { describe, expect, it, vi } from 'vitest';
import {
  parseRecipientRoles,
  recipientRoleSlugs,
  resolveReportScheduleRecipientEmails,
  uniqueRecipientEmails,
} from './reports-recipient-resolve';

function createPrisma(options?: {
  roleEmployees?: Array<{ email: string }>;
  owner?: { email: string } | null;
}) {
  return {
    employee: {
      findMany: vi.fn().mockResolvedValue(options?.roleEmployees ?? []),
      findUnique: vi.fn().mockResolvedValue(options?.owner ?? null),
    },
  };
}

describe('uniqueRecipientEmails', () => {
  it('trims, lowercases and deduplicates', () => {
    expect(
      uniqueRecipientEmails(['CEO@Example.com', ' ceo@example.com ', '', 'owner@x.com']),
    ).toEqual(['ceo@example.com', 'owner@x.com']);
  });
});

describe('parseRecipientRoles', () => {
  it('keeps Owner and CEO together and ignores unknown values', () => {
    expect(parseRecipientRoles(['OWNER', 'CEO', 'OWNER', 'FINANCE'])).toEqual(['OWNER', 'CEO']);
  });
});

describe('recipientRoleSlugs', () => {
  it('maps Owner and CEO to directory role slugs', () => {
    expect(recipientRoleSlugs(['OWNER', 'CEO', 'SCHEDULE_OWNER'])).toEqual(['owner', 'ceo']);
  });
});

describe('resolveReportScheduleRecipientEmails', () => {
  it('resolves Owner and CEO from the employee directory', async () => {
    const prisma = createPrisma({
      roleEmployees: [{ email: 'owner@neetrino.com' }, { email: 'suren@neetrino.com' }],
    });

    await expect(
      resolveReportScheduleRecipientEmails(prisma, {
        recipientRoles: ['OWNER', 'CEO'],
        ownerId: 'pm-1',
        storedEmails: ['stale@example.com'],
      }),
    ).resolves.toEqual(['owner@neetrino.com', 'suren@neetrino.com']);

    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: { slug: { in: ['owner', 'ceo'] } },
        }),
      }),
    );
    expect(prisma.employee.findUnique).not.toHaveBeenCalled();
  });

  it('adds the schedule owner email when that role is selected', async () => {
    const prisma = createPrisma({
      roleEmployees: [{ email: 'suren@neetrino.com' }],
      owner: { email: 'pm@neetrino.com' },
    });

    await expect(
      resolveReportScheduleRecipientEmails(prisma, {
        recipientRoles: ['CEO', 'SCHEDULE_OWNER'],
        ownerId: 'pm-1',
      }),
    ).resolves.toEqual(['suren@neetrino.com', 'pm@neetrino.com']);
  });

  it('falls back to stored emails when no directory recipients exist', async () => {
    const prisma = createPrisma();

    await expect(
      resolveReportScheduleRecipientEmails(prisma, {
        recipientRoles: [],
        ownerId: 'pm-1',
        storedEmails: ['finance@example.com'],
      }),
    ).resolves.toEqual(['finance@example.com']);
  });
});
