import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, type TransactionClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { isAtsTerminalState } from '../../integrations/ats/ats-call-realtime.phase';
import { ActiveCallScreenService } from './active-call-screen.service';
import { CallAccessPolicyService } from './call-access-policy.service';
import type { CallAccessActor } from './call-access.types';
import type { ActiveCallScreenSnapshot } from './active-call-screen.map';
import { CALL_AUDIT_ENTITY_TYPE } from './click-to-call.constants';
import {
  CALL_NOTE_NOT_TERMINAL_MESSAGE,
  CALL_NOTE_UPDATED_AUDIT_ACTION,
  CALL_NOTE_VERSION_CONFLICT_MESSAGE,
} from './calls.constants';

const NOTE_ROW_SELECT = { note: true, noteVersion: true, state: true } as const;

type CallNoteRow = {
  note: string | null;
  noteVersion: number;
  state: string | null;
};

@Injectable()
export class CallNoteService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly access: CallAccessPolicyService,
    private readonly audit: AuditService,
    private readonly screen: ActiveCallScreenService,
  ) {}

  async updateNote(
    callId: string,
    note: string | null,
    expectedNoteVersion: number,
    actor: CallAccessActor,
  ): Promise<ActiveCallScreenSnapshot> {
    await this.access.assertCanAccessCall(actor, callId, 'editNote');
    await this.persistNoteAndAudit(callId, note, expectedNoteVersion, actor.employeeId);
    return this.screen.getScreen(callId, actor);
  }

  private async persistNoteAndAudit(
    callId: string,
    note: string | null,
    expectedNoteVersion: number,
    actorId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const current = await this.loadNoteRow(tx, callId);
      this.assertTerminal(current.state);
      this.assertExpectedVersion(current.noteVersion, expectedNoteVersion);
      await this.saveNote(tx, callId, note, expectedNoteVersion, current.state);
      await this.audit.log(this.auditParams(callId, actorId, current, note), tx);
    });
  }

  private async loadNoteRow(tx: TransactionClient, callId: string): Promise<CallNoteRow> {
    const row = await tx.atsCallEvent.findUnique({
      where: { id: callId },
      select: NOTE_ROW_SELECT,
    });
    if (!row) throw new NotFoundException(`Call ${callId} not found`);
    return row;
  }

  private assertTerminal(state: string | null): void {
    if (isAtsTerminalState(state)) return;
    throw new BadRequestException(CALL_NOTE_NOT_TERMINAL_MESSAGE);
  }

  private assertExpectedVersion(actual: number, expected: number): void {
    if (actual === expected) return;
    throw new ConflictException(CALL_NOTE_VERSION_CONFLICT_MESSAGE);
  }

  private async saveNote(
    tx: TransactionClient,
    callId: string,
    note: string | null,
    expectedNoteVersion: number,
    state: string | null,
  ): Promise<void> {
    const result = await tx.atsCallEvent.updateMany({
      where: { id: callId, noteVersion: expectedNoteVersion, state },
      data: { note, noteVersion: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new ConflictException(CALL_NOTE_VERSION_CONFLICT_MESSAGE);
    }
  }

  private auditParams(
    callId: string,
    actorId: string,
    current: CallNoteRow,
    newNote: string | null,
  ) {
    return {
      entityType: CALL_AUDIT_ENTITY_TYPE,
      entityId: callId,
      action: CALL_NOTE_UPDATED_AUDIT_ACTION,
      userId: actorId,
      changes: {
        oldNote: current.note,
        newNote,
        oldVersion: current.noteVersion,
        newVersion: current.noteVersion + 1,
      },
    };
  }
}
