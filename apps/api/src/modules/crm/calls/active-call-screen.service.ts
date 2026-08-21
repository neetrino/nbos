import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { mapCallDirection, parseDurationSec } from './call-response.map';
import { assertCanViewCall } from './calls-access';
import { CALL_SCREEN_RECENT_LIMIT } from './calls.constants';
import { mapActiveCallScreen, type ActiveCallScreenSnapshot } from './active-call-screen.map';
import { mapAtsStateToPhase } from '../../integrations/ats/ats-call-realtime.phase';

const SCREEN_SELECT = {
  id: true,
  uid: true,
  calldirect: true,
  state: true,
  phone: true,
  clid: true,
  billsec: true,
  disposition: true,
  note: true,
  recordingStatus: true,
  leadId: true,
  contactId: true,
  dealId: true,
  lead: { select: { name: true, contactName: true } },
  contact: {
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      extraPhones: { select: { e164: true }, orderBy: { createdAt: 'asc' } },
      companies: { select: { name: true }, take: 1 },
    },
  },
  deal: {
    select: {
      name: true,
      code: true,
      status: true,
      amount: true,
      projectId: true,
      existingProduct: { select: { name: true } },
    },
  },
} as const;

@Injectable()
export class ActiveCallScreenService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getScreen(
    callId: string,
    permissions: Record<string, string>,
  ): Promise<ActiveCallScreenSnapshot> {
    const row = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: SCREEN_SELECT,
    });
    if (!row) throw new NotFoundException(`Call ${callId} not found`);
    assertCanViewCall(permissions, row);
    const [projectName, productName, recentCalls] = await Promise.all([
      this.resolveProjectName(row.deal?.projectId ?? null),
      Promise.resolve(row.deal?.existingProduct?.name ?? null),
      this.findRecentCalls(row.phone ?? row.clid, row.id),
    ]);
    return mapActiveCallScreen(row, { projectName, productName, recentCalls });
  }

  async updateNote(
    callId: string,
    note: string | null,
    permissions: Record<string, string>,
  ): Promise<ActiveCallScreenSnapshot> {
    const existing = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: { id: true, leadId: true, contactId: true, dealId: true },
    });
    if (!existing) throw new NotFoundException(`Call ${callId} not found`);
    assertCanViewCall(permissions, existing);
    await this.prisma.atsCallEvent.update({
      where: { id: callId },
      data: { note },
    });
    return this.getScreen(callId, permissions);
  }

  private async resolveProjectName(projectId: string | null): Promise<string | null> {
    if (!projectId) return null;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
    return project?.name ?? null;
  }

  private async findRecentCalls(phone: string | null, callId: string) {
    if (!phone) return [];
    const rows = await this.prisma.atsCallEvent.findMany({
      where: { phone, id: { not: callId } },
      orderBy: { createdAt: 'desc' },
      take: CALL_SCREEN_RECENT_LIMIT,
      select: { id: true, calldirect: true, state: true, createdAt: true, billsec: true },
    });
    return rows.map((row) => ({
      id: row.id,
      direction: mapCallDirection(row.calldirect),
      phase: mapAtsStateToPhase(row.state),
      createdAt: row.createdAt,
      durationSec: parseDurationSec(row.billsec),
    }));
  }
}
