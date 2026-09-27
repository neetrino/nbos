'use client';

import type { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DetailSheetSection, RelationPickerField } from '@/components/shared';
import {
  useDealRelationSearch,
  useProjectRelationSearch,
} from '@/components/shared/relation-picker';
import type { VideoMeetingCard, VideoMeetingEntityLinkType } from '@/lib/api/video-meetings';

export type VideoMeetingsDetailT = ReturnType<typeof useTranslations<'videoMeetings'>>;

export function VideoMeetingEntityLinksSection({
  card,
  onAttach,
  onDetach,
  t,
}: {
  card: VideoMeetingCard;
  onAttach: (entityType: VideoMeetingEntityLinkType, entityId: string) => Promise<void>;
  onDetach: (linkId: string) => Promise<void>;
  t: VideoMeetingsDetailT;
}) {
  const searchDeals = useDealRelationSearch();
  const searchProjects = useProjectRelationSearch();

  return (
    <DetailSheetSection title={t('detail.entityLinks')}>
      <div className="space-y-3">
        <RelationPickerField
          label={t('detail.dealLabel')}
          entityKind="deal"
          value={null}
          placeholder={t('detail.pickDeal')}
          onSearch={searchDeals}
          onSelect={(id) => void onAttach('DEAL', id)}
        />
        <RelationPickerField
          label={t('detail.projectLabel')}
          entityKind="project"
          value={null}
          placeholder={t('detail.pickProject')}
          onSearch={searchProjects}
          onSelect={(id) => void onAttach('PROJECT', id)}
        />
        <VideoMeetingLinkedEntities card={card} onDetach={onDetach} t={t} />
      </div>
    </DetailSheetSection>
  );
}

function VideoMeetingLinkedEntities({
  card,
  onDetach,
  t,
}: {
  card: VideoMeetingCard;
  onDetach: (linkId: string) => Promise<void>;
  t: VideoMeetingsDetailT;
}) {
  if (card.entityLinks.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('detail.noEntityLinks')}</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {card.entityLinks.map((link) => (
        <li key={link.id} className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">
            {linkLabel(link.entityType, t)} · {link.entityId}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => void onDetach(link.id)}>
            {t('actions.detachLink')}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function linkLabel(entityType: string, t: VideoMeetingsDetailT): string {
  if (entityType === 'DEAL') return t('detail.dealLabel');
  if (entityType === 'PROJECT') return t('detail.projectLabel');
  return entityType;
}
