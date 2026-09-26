'use client';

import { format } from 'date-fns';
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
  freshSecret,
  onCreate,
  onRevoke,
  t,
}: {
  invites: InviteListItem[];
  freshSecret: string | null;
  onCreate: () => Promise<void>;
  onRevoke: (inviteId: string) => Promise<void>;
  t: VideoMeetingsDetailT;
}) {
  return (
    <section className="border-border rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{t('detail.invites')}</h2>
        <Button type="button" size="sm" onClick={() => void onCreate()}>
          {t('actions.createInvite')}
        </Button>
      </div>
      {freshSecret && (
        <div className="bg-muted/50 mb-3 rounded-md p-3 text-sm">
          <p className="font-medium">{t('detail.inviteSecretTitle')}</p>
          <p className="text-muted-foreground text-xs">{t('detail.inviteSecretHint')}</p>
          <code className="mt-2 block break-all">{freshSecret}</code>
        </div>
      )}
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
              {!invite.revokedAt && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onRevoke(invite.id)}
                >
                  {t('actions.revokeInvite')}
                </Button>
              )}
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
    <section className="border-border rounded-lg border p-4">
      <h2 className="mb-1 text-sm font-medium">{t('detail.entityLinks')}</h2>
      <p className="text-muted-foreground mb-3 text-xs">{t('detail.entityLinksHint')}</p>
      <div className="mb-3 flex flex-wrap gap-2">
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
        <Button type="button" size="sm" onClick={() => void onAttach()}>
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
