import type { DeskLineIconKey, DeskLinePoolId, DeskLineTemplate, DeskLineTone } from './desk-line.types';

export function deskPair(
  id: string,
  pool: DeskLinePoolId,
  theme: string,
  icon: DeskLineIconKey,
  title: string,
  subline: string,
  extra?: { tone?: DeskLineTone; eventId?: string },
): DeskLineTemplate {
  return {
    id,
    pool,
    theme,
    icon,
    title,
    subline,
    tone: extra?.tone ?? 'warm',
    eventId: extra?.eventId,
  };
}
