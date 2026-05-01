import type { MailDeliveryLogKind, PrismaClient } from '@nbos/database';

export async function appendMailDeliveryLog(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    emailMessageId: string;
    mailAccountId: string;
    actorEmployeeId: string;
    kind: MailDeliveryLogKind;
    detail?: string | null;
  },
): Promise<void> {
  await prisma.mailDeliveryLog.create({
    data: {
      emailMessageId: params.emailMessageId,
      mailAccountId: params.mailAccountId,
      actorEmployeeId: params.actorEmployeeId,
      kind: params.kind,
      detail: params.detail ?? null,
    },
  });
}
