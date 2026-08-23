import { NotFoundException } from '@nestjs/common';
import type { PrismaTransaction } from '../agents/agent-row-lock';

export async function lockApprovalRequestRow(tx: PrismaTransaction, id: string) {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM ai_approval_requests WHERE id = ${id} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException('Approval request not found');
  }
  return tx.aiApprovalRequest.findUniqueOrThrow({ where: { id } });
}
