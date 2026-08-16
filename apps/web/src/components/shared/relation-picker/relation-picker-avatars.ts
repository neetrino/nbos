import { useCallback, useState } from 'react';
import type { RelationPickerOption } from './relation-picker.types';

export function mergeAvatarRecords(
  ...maps: Array<Record<string, string | null> | undefined>
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const map of maps) {
    if (!map) continue;
    for (const [id, avatar] of Object.entries(map)) {
      const trimmed = avatar?.trim();
      if (trimmed) out[id] = trimmed;
    }
  }
  return out;
}

export function avatarsFromOptions(options: RelationPickerOption[]): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const option of options) {
    const trimmed = option.avatar?.trim();
    if (trimmed) out[option.value] = trimmed;
  }
  return out;
}

export function pickAvatarRecord(
  ids: string[],
  avatars: Record<string, string | null>,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const id of ids) {
    const trimmed = avatars[id]?.trim();
    if (trimmed) out[id] = trimmed;
  }
  return out;
}

export function useMergedPickerAvatars(
  selectionAvatars: Record<string, string | null> | undefined,
  results: RelationPickerOption[],
): {
  knownAvatars: Record<string, string | null>;
  rememberAvatar: (id: string, avatar?: string) => void;
} {
  const [remembered, setRemembered] = useState<Record<string, string | null>>({});
  const knownAvatars = mergeAvatarRecords(
    remembered,
    selectionAvatars,
    avatarsFromOptions(results),
  );

  const rememberAvatar = useCallback((id: string, avatar?: string) => {
    const trimmed = avatar?.trim();
    if (!id || !trimmed) return;
    setRemembered((prev) => mergeAvatarRecords(prev, { [id]: trimmed }));
  }, []);

  return { knownAvatars, rememberAvatar };
}
