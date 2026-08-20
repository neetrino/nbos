import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { CEO_ROLE_SLUG, PLATFORM_OWNERSHIP_SINGLETON_ID } from '@nbos/shared';
import {
  REPORT_RECIPIENT_EMPLOYEE_STATUSES,
  REPORT_SCHEDULE_RECIPIENT_ROLES,
  type ReportScheduleRecipientRole,
} from './reports-recipient-roles';

type ReportsPrisma = Pick<InstanceType<typeof PrismaClient>, 'employee' | 'platformOwnership'>;

export function uniqueRecipientEmails(emails: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push(email);
  }
  return result;
}

export function parseRecipientRoles(value: unknown): ReportScheduleRecipientRole[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(REPORT_SCHEDULE_RECIPIENT_ROLES);
  const roles: ReportScheduleRecipientRole[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.has(item)) continue;
    const role = item as ReportScheduleRecipientRole;
    if (!roles.includes(role)) roles.push(role);
  }
  return roles;
}

/** CEO directory slug only. OWNER is PlatformOwnership identity, not role `owner`. */
export function recipientRoleSlugs(roles: readonly ReportScheduleRecipientRole[]): string[] {
  return roles.includes('CEO') ? [CEO_ROLE_SLUG] : [];
}

export async function resolveReportScheduleRecipientEmails(
  prisma: ReportsPrisma,
  input: {
    recipientRoles: readonly ReportScheduleRecipientRole[];
    ownerId: string;
    storedEmails?: readonly string[];
  },
): Promise<string[]> {
  const fromRoles = await resolveRoleEmails(prisma, input.recipientRoles, input.ownerId);
  if (fromRoles.length > 0) return fromRoles;
  return uniqueRecipientEmails(input.storedEmails ?? []);
}

export async function requireReportScheduleRecipientEmails(
  prisma: ReportsPrisma,
  input: {
    recipientRoles: readonly ReportScheduleRecipientRole[];
    ownerId: string;
    storedEmails?: readonly string[];
  },
): Promise<string[]> {
  const emails = await resolveReportScheduleRecipientEmails(prisma, input);
  if (emails.length === 0) {
    throw new BadRequestException(
      'Founder/CEO emails were not found. Check My Company employees or include the schedule owner.',
    );
  }
  return emails;
}

async function resolveRoleEmails(
  prisma: ReportsPrisma,
  roles: readonly ReportScheduleRecipientRole[],
  ownerId: string,
): Promise<string[]> {
  const emails: string[] = [];
  if (roles.includes('OWNER')) {
    emails.push(...(await loadPlatformOwnerEmails(prisma)));
  }
  const slugs = recipientRoleSlugs(roles);
  if (slugs.length > 0) {
    const employees = await prisma.employee.findMany({
      where: {
        status: { in: [...REPORT_RECIPIENT_EMPLOYEE_STATUSES] },
        role: { slug: { in: slugs } },
      },
      select: { email: true },
    });
    emails.push(...employees.map((employee) => employee.email));
  }
  if (roles.includes('SCHEDULE_OWNER')) {
    const owner = await prisma.employee.findUnique({
      where: { id: ownerId },
      select: { email: true },
    });
    if (owner?.email) emails.push(owner.email);
  }
  return uniqueRecipientEmails(emails);
}

async function loadPlatformOwnerEmails(prisma: ReportsPrisma): Promise<string[]> {
  const ownership = await prisma.platformOwnership.findUnique({
    where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
    select: { ownerEmployeeId: true },
  });
  if (!ownership?.ownerEmployeeId) return [];
  const founder = await prisma.employee.findUnique({
    where: { id: ownership.ownerEmployeeId },
    select: { email: true, status: true },
  });
  if (!founder?.email) return [];
  if (founder.status !== 'ACTIVE' && founder.status !== 'PROBATION') return [];
  return [founder.email];
}
