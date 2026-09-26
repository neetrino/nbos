'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import type { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DetailSheetSection, RelationPickerField } from '@/components/shared';
import {
  useDealRelationSearch,
  useProjectRelationSearch,
} from '@/components/shared/relation-picker';
import type {
  InviteListItem,
  VideoMeetingCard,
  VideoMeetingEntityLinkType,
} from '@/lib/api/video-meetings';

export type VideoMeetingsDetailT = ReturnType<typeof useTranslations<'videoMeetings'>>;

export function VideoMeetingInviteSection({
  invites,
  freshJoinUrl,
  onCreate,
  onRevoke,
  t,
}: {
  invites: InviteListItem[];
  freshJoinUrl: string | null;
  onCreate: () => Promise<void>;
  onRevoke: (inviteId: string) => Promise<void>;
  t: VideoMeetingsDetailT;
}) {
  const [copied, setCopied] = useState(false);

  const copyJoinUrl = async () => {
    if (!freshJoinUrl) return;
    try {
      await navigator.clipboard.writeText(freshJoinUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="bg-card/40 border-border/80 space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">{t('detail.invites')}</h2>
          <p className="text-muted-foreground mt-1 text-xs">{t('detail.guestInviteHint')}</p>
        </div>
        <Button type="button" size="sm" onClick={() => void onCreate()}>
          {t('actions.createInvite')}
        </Button>
      </div>
      {freshJoinUrl ? (
        <div className="bg-muted/50 space-y-2 rounded-md p-3 text-sm">
          <p className="font-medium">{t('detail.inviteLinkTitle')}</p>
          <p className="text-muted-foreground text-xs">{t('detail.inviteSecretHint')}</p>
          <code className="block text-xs break-all">{freshJoinUrl}</code>
          <Button type="button" size="sm" variant="outline" onClick={() => void copyJoinUrl()}>
            {copied ? t('actions.copied') : t('actions.copyInviteLink')}
          </Button>
        </div>
      ) : null}
      {invites.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('detail.noInvites')}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {invites.map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {t('detail.inviteExpires')}: {format(new Date(invite.expiresAt), 'PPp')}
                {invite.revokedAt ? ` · ${t('detail.inviteRevoked')}` : ''}
              </span>
              {!invite.revokedAt ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onRevoke(invite.id)}
                >
                  {t('actions.revokeInvite')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

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
