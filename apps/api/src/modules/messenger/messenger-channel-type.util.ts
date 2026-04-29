/** Values persisted by Prisma enum `MessengerChannelType`. */
export type DbMessengerChannelType = 'PROJECT' | 'GENERAL' | 'ANNOUNCEMENT';

export type MessengerChannelTypeApi = 'project' | 'general' | 'announcement';

export function channelTypeToApi(db: DbMessengerChannelType): MessengerChannelTypeApi {
  if (db === 'PROJECT') return 'project';
  if (db === 'ANNOUNCEMENT') return 'announcement';
  return 'general';
}

export function channelTypeFromApi(api: MessengerChannelTypeApi): DbMessengerChannelType {
  if (api === 'project') return 'PROJECT';
  if (api === 'announcement') return 'ANNOUNCEMENT';
  return 'GENERAL';
}
