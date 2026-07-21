import type { InputJsonValue, PrismaClient } from '@nbos/database';

const INVOICE_REMINDER_RULE_RESOLVER = 'FINANCE_TEAM';
const INVOICE_REMINDER_SOURCE_MODULE = 'finance';

export async function createInvoiceReminderNotificationJob(
  prisma: InstanceType<typeof PrismaClient>,
  input: {
    type: string;
    invoiceId: string;
    dedupeKey: string;
    idempotencyKey: string;
    scheduledFor: Date;
    payload: InputJsonValue;
  },
): Promise<{ jobId: string }> {
  const rule = await prisma.notificationRule.upsert({
    where: { code: input.type },
    update: { enabled: true, priority: 'high', channels: ['WHATSAPP'] },
    create: {
      code: input.type,
      eventType: input.type,
      recipientResolver: INVOICE_REMINDER_RULE_RESOLVER,
      priority: 'high',
      channels: ['WHATSAPP'],
    },
  });
  const event = await prisma.notificationEvent.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: {},
    create: {
      eventType: input.type,
      sourceModule: INVOICE_REMINDER_SOURCE_MODULE,
      sourceEntityType: 'Invoice',
      sourceEntityId: input.invoiceId,
      payload: input.payload,
      idempotencyKey: input.idempotencyKey,
    },
  });
  const job = await prisma.notificationJob.create({
    data: {
      eventId: event.id,
      ruleId: rule.id,
      status: 'PENDING',
      scheduledFor: input.scheduledFor,
      dedupeKey: input.dedupeKey,
    },
  });
  return { jobId: job.id };
}
