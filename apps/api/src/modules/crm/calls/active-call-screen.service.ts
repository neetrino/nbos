import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  buildRecentConversationCards,
  lidsOfGroups,
  pickRecentConversationGroups,
  type RecentConnection,
} from './active-call-recent';
import { conversationDurationSec, conversationPhase, normalizeCallLid } from './call-conversation';
import { CallAccessPolicyService } from './call-access-policy.service';
import type { CallAccessActor } from './call-access.types';
import { CALL_SCREEN_RECENT_LIMIT, CALL_SCREEN_RECENT_SCAN_FACTOR } from './calls.constants';
import { mapActiveCallScreen, type ActiveCallScreenSnapshot } from './active-call-screen.map';
import { AtsClickToCallLiveReconcileService } from '../../integrations/ats/ats-click-to-call-live-reconcile.service';

const SCREEN_LEG_SELECT = {
  state: true,
  billsec: true,
  disposition: true,
} as const;

const RECENT_CONNECTION_SELECT = {
  id: true,
  lid: true,
  calldirect: true,
  state: true,
  createdAt: true,
  billsec: true,
} as const;

const ANSWERED_DISPOSITION = 'ANSWERED';

const SCREEN_SELECT = {
  id: true,
  uid: true,
  lid: true,
  calldirect: true,
  state: true,
  phone: true,
  clid: true,
  billsec: true,
  disposition: true,
  note: true,
  noteVersion: true,
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
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly access: CallAccessPolicyService,
    private readonly liveReconcile: AtsClickToCallLiveReconcileService,
  ) {}

  async getScreen(callId: string, actor: CallAccessActor): Promise<ActiveCallScreenSnapshot> {
    const accessWhere = await this.access.assertCanAccessCall(actor, callId);
    await this.liveReconcile.syncIfPending(callId);
    const row = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: SCREEN_SELECT,
    });
    if (!row) throw new NotFoundException(`Call ${callId} not found`);
    const lid = normalizeCallLid(row.lid);
    const [projectName, productName, recentCalls, legs] = await Promise.all([
      this.resolveProjectName(row.deal?.projectId ?? null),
      Promise.resolve(row.deal?.existingProduct?.name ?? null),
      this.findRecentCalls(row.phone ?? row.clid, row.id, accessWhere, lid),
      this.findConversationLegs(lid, accessWhere),
    ]);
    const snapshot = mapActiveCallScreen(row, { projectName, productName, recentCalls });
    return overlayConversationScreen(snapshot, legs);
  }

  private async resolveProjectName(projectId: string | null): Promise<string | null> {
    if (!projectId) return null;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
    return project?.name ?? null;
  }

  private async findConversationLegs(
    lid: string | null,
    accessWhere: Prisma.AtsCallEventWhereInput,
  ) {
    if (!lid) return [];
    return this.prisma.atsCallEvent.findMany({
      where: { AND: [accessWhere, { lid }] },
      select: SCREEN_LEG_SELECT,
    });
  }

  private async findRecentCalls(
    phone: string | null,
    callId: string,
    accessWhere: Prisma.AtsCallEventWhereInput,
    lid: string | null,
  ) {
    if (!phone) return [];
    const scanned = await this.loadRecentScan(phone, callId, accessWhere, lid);
    const picked = pickRecentConversationGroups(scanned, CALL_SCREEN_RECENT_LIMIT);
    const legs = await this.loadRecentLidLegs(picked, accessWhere, callId);
    return buildRecentConversationCards(picked, legs);
  }

  private loadRecentScan(
    phone: string,
    callId: string,
    accessWhere: Prisma.AtsCallEventWhereInput,
    lid: string | null,
  ): Promise<RecentConnection[]> {
    return this.prisma.atsCallEvent.findMany({
      where: recentCallWhere(phone, callId, accessWhere, lid),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: CALL_SCREEN_RECENT_LIMIT * CALL_SCREEN_RECENT_SCAN_FACTOR,
      select: RECENT_CONNECTION_SELECT,
    });
  }

  private async loadRecentLidLegs(
    picked: ReadonlyArray<readonly RecentConnection[]>,
    accessWhere: Prisma.AtsCallEventWhereInput,
    callId: string,
  ): Promise<RecentConnection[]> {
    const lids = lidsOfGroups(picked);
    if (lids.length === 0) return [];
    return this.prisma.atsCallEvent.findMany({
      where: { AND: [accessWhere, { lid: { in: lids } }, { id: { not: callId } }] },
      select: RECENT_CONNECTION_SELECT,
    });
  }
}

function recentCallWhere(
  phone: string,
  callId: string,
  accessWhere: Prisma.AtsCallEventWhereInput,
  lid: string | null,
): Prisma.AtsCallEventWhereInput {
  const phoneWhere = { phone, id: { not: callId } };
  if (!lid) return { AND: [phoneWhere, accessWhere] };
  return {
    AND: [phoneWhere, { OR: [{ lid: null }, { lid: { not: lid } }] }, accessWhere],
  };
}

function overlayConversationScreen(
  snapshot: ActiveCallScreenSnapshot,
  legs: ReadonlyArray<{ state: string | null; billsec: string | null; disposition: string | null }>,
): ActiveCallScreenSnapshot {
  if (legs.length <= 1) return snapshot;
  const durationSec = conversationDurationSec(legs);
  const answered = legs.some((leg) => leg.disposition === ANSWERED_DISPOSITION);
  return {
    ...snapshot,
    phase: conversationPhase(legs),
    durationSec: durationSec ?? snapshot.durationSec,
    disposition: answered ? ANSWERED_DISPOSITION : snapshot.disposition,
  };
}
