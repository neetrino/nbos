'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import type { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  entityType,
  entityId,
  onEntityType,
  onEntityId,
  onAttach,
  onDetach,
  t,
}: {
  card: VideoMeetingCard;
  entityType: VideoMeetingEntityLinkType;
  entityId: string;
  onEntityType: (value: VideoMeetingEntityLinkType) => void;
  onEntityId: (value: string) => void;
  onAttach: () => Promise<void>;
  onDetach: (linkId: string) => Promise<void>;
  t: VideoMeetingsDetailT;
}) {
  return (
    <section className="bg-muted/20 border-border/70 space-y-3 rounded-xl border border-dashed p-4">
      <div>
        <h2 className="text-sm font-medium">{t('detail.entityLinks')}</h2>
        <p className="text-muted-foreground mt-1 text-xs">{t('detail.entityLinksHint')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select
          value={entityType}
          onValueChange={(value) => onEntityType(value as VideoMeetingEntityLinkType)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('detail.entityType')} />
          </SelectTrigger>
          <SelectContent>
            {(['DEAL', 'PROJECT', 'PRODUCT', 'CONTACT'] as const).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={entityId}
          onChange={(event) => onEntityId(event.target.value)}
          placeholder={t('detail.entityId')}
          className="max-w-xs"
        />
        <Button type="button" size="sm" variant="secondary" onClick={() => void onAttach()}>
          {t('actions.attachLink')}
        </Button>
      </div>
      {card.entityLinks.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('detail.noEntityLinks')}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {card.entityLinks.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {link.entityType} · {link.entityId}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void onDetach(link.id)}
              >
                {t('actions.detachLink')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
