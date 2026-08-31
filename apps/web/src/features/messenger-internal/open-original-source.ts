import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import type {
  MessengerCoreMessageRow,
  MessengerCoreSourceMessageRow,
} from '@/lib/api/messenger-core';
import { canonicalSourceMessageIds } from './canonical-source-message-ids';

export type OpenOriginalDeps = {
  getSourceMessage: (id: string) => Promise<MessengerCoreSourceMessageRow>;
  onOpenInternalSource?: (conversationId: string) => void;
  writeText?: (text: string) => Promise<void>;
};

export function sourceIdsForOpenOriginal(messages: MessengerCoreMessageRow[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const message of messages) {
    for (const id of canonicalSourceMessageIds(message)) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export async function openOriginalFromMessages(
  messages: MessengerCoreMessageRow[],
  deps: OpenOriginalDeps,
): Promise<void> {
  await openOriginalBySourceIds(sourceIdsForOpenOriginal(messages), deps);
}

export async function openOriginalBySourceIds(
  sourceMessageIds: string[],
  deps: OpenOriginalDeps,
): Promise<void> {
  if (sourceMessageIds.length === 0) return;
  try {
    const sources = await loadSources(sourceMessageIds, deps.getSourceMessage);
    const internal = sources.find((row) => row.zone === 'INTERNAL');
    if (internal) {
      deps.onOpenInternalSource?.(internal.conversationId);
      return;
    }
    toast.message('Source is a Client conversation. Copied preview instead.');
    await writeSourceBodies(sources, deps.writeText);
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'You cannot open this source.'));
  }
}

export async function copySourceFromMessages(
  messages: MessengerCoreMessageRow[],
  deps: Pick<OpenOriginalDeps, 'getSourceMessage' | 'writeText'>,
): Promise<void> {
  const ids = sourceIdsForOpenOriginal(messages);
  if (ids.length === 0) return;
  try {
    const sources = await loadSources(ids, deps.getSourceMessage);
    await writeSourceBodies(sources, deps.writeText);
    toast.success('Source copied');
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'You cannot copy this source.'));
  }
}

async function loadSources(
  ids: string[],
  getSourceMessage: OpenOriginalDeps['getSourceMessage'],
): Promise<MessengerCoreSourceMessageRow[]> {
  const sources: MessengerCoreSourceMessageRow[] = [];
  for (const id of ids) {
    sources.push(await getSourceMessage(id));
  }
  return sources;
}

async function writeSourceBodies(
  sources: MessengerCoreSourceMessageRow[],
  writeText?: (text: string) => Promise<void>,
): Promise<void> {
  const body = sources.map((row) => row.content).join('\n\n');
  const write = writeText ?? ((text) => navigator.clipboard.writeText(text));
  await write(body);
}
