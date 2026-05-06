import type { PrismaClient } from '@nbos/database';

export async function loadMessengerChannelMessageWindow(
  prisma: InstanceType<typeof PrismaClient>,
  channelId: string,
  options: { before: Date | undefined; limit: number },
): Promise<{
  rowsAsc: Awaited<
    ReturnType<InstanceType<typeof PrismaClient>['messengerChannelMessage']['findMany']>
  >;
  hasMoreOlder: boolean;
}> {
  const take = options.limit + 1;
  const where = {
    channelId,
    ...(options.before ? { createdAt: { lt: options.before } } : {}),
  };
  const rowsDesc = await prisma.messengerChannelMessage.findMany({
    where,
    include: { attachments: true },
    orderBy: { createdAt: 'desc' },
    take,
  });
  const hasMoreOlder = rowsDesc.length > options.limit;
  const slice = hasMoreOlder ? rowsDesc.slice(0, options.limit) : rowsDesc;
  return { rowsAsc: [...slice].reverse(), hasMoreOlder };
}
