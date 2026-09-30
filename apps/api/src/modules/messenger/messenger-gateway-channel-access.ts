import { PrismaClient } from '@nbos/database';
import {
  canAccessMessengerChannel,
  loadMessengerLegacyAccess,
} from './access/messenger-legacy-channel-access.op';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function employeeMayUseMessengerChannel(
  prisma: PrismaLike,
  employeeId: string,
  channelId: string,
): Promise<boolean> {
  const access = await loadMessengerLegacyAccess(prisma, employeeId);
  if (!access || access.viewScope === 'NONE') return false;
  const channel = await prisma.messengerChannel.findUnique({
    where: { id: channelId },
    select: { id: true, projectId: true, type: true },
  });
  if (!channel) return false;
  return canAccessMessengerChannel(prisma, access, channel);
}

export async function messengerTypingDisplayLabel(
  prisma: PrismaLike,
  employeeId: string,
): Promise<string> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { firstName: true },
  });
  const name = emp?.firstName?.trim();
  return name && name.length > 0 ? name : 'Someone';
}
