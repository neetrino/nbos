'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Link2, Plus, UserPlus, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateEmployeeSheet } from '@/features/hr/components/CreateEmployeeSheet';
import { InviteEmployeeDialog } from '@/features/hr/components/InviteEmployeeDialog';
import { invitationsApi, type Employee } from '@/lib/api/employees';
import { getApiErrorMessage } from '@/lib/api-errors';
import { PermissionGate } from '@/lib/permissions';

type LinkMode = 'open' | 'setup' | 'email';

export function browserAcceptInviteUrl(token: string): string {
  return `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`;
}

export function useTeamDirectoryAdd(options: {
  onEmployeeCreated: (employee: Employee) => void;
  onChanged: () => void;
}) {
  const t = useTranslations('hr');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [link, setLink] = useState<{ token: string; mode: LinkMode } | null>(null);
  const linkUrl = link ? browserAcceptInviteUrl(link.token) : '';

  async function issueOpenLink() {
    try {
      const issued = await invitationsApi.openLink();
      setLink({ token: issued.token, mode: 'open' });
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('directory.linkFailed')));
    }
  }

  async function issueAccessLink(employee: Employee) {
    try {
      const issued = await invitationsApi.accessLink(employee.id);
      setLink({ token: issued.token, mode: 'setup' });
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('directory.linkFailed')));
    }
    options.onEmployeeCreated(employee);
  }

  return {
    menu: (
      <TeamAddMenu
        onCreate={() => setCreateOpen(true)}
        onInvite={() => setInviteOpen(true)}
        onOpenLink={() => void issueOpenLink()}
      />
    ),
    buttons: (
      <TeamAddButtons
        onCreate={() => setCreateOpen(true)}
        onInvite={() => setInviteOpen(true)}
        onOpenLink={() => void issueOpenLink()}
      />
    ),
    dialogs: (
      <TeamAddDialogs
        createOpen={createOpen}
        inviteOpen={inviteOpen}
        linkUrl={linkUrl}
        linkDescription={linkDescription(link?.mode, {
          open: t('directory.linkOpen'),
          setup: t('directory.linkSetup'),
          email: t('directory.linkEmail'),
        })}
        onCreateOpenChange={setCreateOpen}
        onInviteOpenChange={setInviteOpen}
        onCreated={(employee) => void issueAccessLink(employee)}
        onInviteSuccess={options.onChanged}
        onIssued={(token) => setLink({ token, mode: 'email' })}
        onLinkOpenChange={(open) => {
          if (!open) setLink(null);
        }}
      />
    ),
  };
}

function linkDescription(
  mode: LinkMode | undefined,
  copy: { open: string; setup: string; email: string },
): string {
  if (mode === 'open') return copy.open;
  if (mode === 'setup') return copy.setup;
  return copy.email;
}

function TeamAddMenu({
  onCreate,
  onInvite,
  onOpenLink,
}: {
  onCreate: () => void;
  onInvite: () => void;
  onOpenLink: () => void;
}) {
  const t = useTranslations('hr');
  return (
    <PermissionGate module="COMPANY" action="ADD">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button {...props} type="button">
              <Plus size={16} aria-hidden />
              {t('directory.add')}
              <ChevronDown className="ml-1 size-4 opacity-70" aria-hidden />
            </Button>
          )}
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onCreate}>
            <Users2 className="mr-2 size-4" />
            {t('directory.createEmployee')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onInvite}>
            <UserPlus className="mr-2 size-4" />
            {t('directory.sendInvitation')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenLink}>
            <Link2 className="mr-2 size-4" />
            {t('directory.inviteLink')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PermissionGate>
  );
}

function TeamAddButtons({
  onCreate,
  onInvite,
  onOpenLink,
}: {
  onCreate: () => void;
  onInvite: () => void;
  onOpenLink: () => void;
}) {
  const t = useTranslations('hr');
  return (
    <PermissionGate module="COMPANY" action="ADD">
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onCreate}>
          <Plus size={16} /> {t('directory.createEmployee')}
        </Button>
        <Button variant="outline" onClick={onInvite}>
          <UserPlus size={16} /> {t('directory.sendInvitation')}
        </Button>
        <Button variant="outline" onClick={onOpenLink}>
          <Link2 size={16} /> {t('directory.inviteLink')}
        </Button>
      </div>
    </PermissionGate>
  );
}

function TeamAddDialogs({
  createOpen,
  inviteOpen,
  linkUrl,
  linkDescription: description,
  onCreateOpenChange,
  onInviteOpenChange,
  onCreated,
  onInviteSuccess,
  onIssued,
  onLinkOpenChange,
}: {
  createOpen: boolean;
  inviteOpen: boolean;
  linkUrl: string;
  linkDescription: string;
  onCreateOpenChange: (open: boolean) => void;
  onInviteOpenChange: (open: boolean) => void;
  onCreated: (employee: Employee) => void;
  onInviteSuccess: () => void;
  onIssued: (token: string) => void;
  onLinkOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <CreateEmployeeSheet
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        onCreated={onCreated}
      />
      <InviteEmployeeDialog
        open={inviteOpen}
        onOpenChange={onInviteOpenChange}
        onSuccess={onInviteSuccess}
        onIssued={onIssued}
      />
      <InviteLinkDialog
        open={linkUrl.length > 0}
        url={linkUrl}
        description={description}
        onOpenChange={onLinkOpenChange}
      />
    </>
  );
}

function InviteLinkDialog({
  open,
  url,
  description,
  onOpenChange,
}: {
  open: boolean;
  url: string;
  description: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('hr');

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('directory.linkCopied'));
    } catch {
      toast.error(t('directory.linkFailed'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('directory.linkTitle')}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <input
          readOnly
          value={url}
          aria-label={t('directory.linkTitle')}
          className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
          onFocus={(event) => event.currentTarget.select()}
        />
        <div className="flex justify-end">
          <Button type="button" onClick={() => void copy()}>
            {t('directory.linkCopy')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
