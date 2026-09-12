'use client';

import { ChevronRight, LogOut, UserCircle2, Wallet } from 'lucide-react';
import { signOutClient } from '@/lib/auth/session-sign-out';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMyAccountSheet } from '@/features/account/components/my-account-sheet-provider';
import { useMyWalletSheet } from '@/features/account/components/my-wallet-sheet-provider';
import type { MeResponse } from '@/lib/permissions/types';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import {
  ACCOUNT_MENU_SIDE_OFFSET,
  ACCOUNT_MENU_WIDTH_CLASS,
} from './account-menu-dropdown-constants';

function displayNameFromMe(me: MeResponse | null | undefined, fallback: string): string {
  if (me?.firstName && me?.lastName) {
    return `${me.firstName} ${me.lastName}`;
  }
  return me?.firstName ?? me?.email ?? fallback;
}

function initialsFromMe(me: MeResponse | null | undefined): string {
  const fromName = me?.firstName?.[0];
  if (fromName) {
    return fromName.toUpperCase();
  }
  const fromEmail = me?.email?.[0];
  return fromEmail ? fromEmail.toUpperCase() : 'U';
}

type ProfileHeaderProps = {
  me: MeResponse | null | undefined;
  displayName: string;
  initials: string;
  photoAlt: string;
};

function AccountMenuProfileHeader({ me, displayName, initials, photoAlt }: ProfileHeaderProps) {
  const photo = me?.avatar?.trim();
  const subtitle = me?.position?.trim() || me?.email?.trim();

  return (
    <div className="border-border from-muted/50 rounded-t-2xl border-b bg-gradient-to-b to-transparent px-4 pt-5 pb-4">
      <div className="flex gap-3">
        <Avatar size="lg" className="size-12 shadow-sm">
          {photo ? <AvatarImage src={photo} alt={photoAlt} /> : null}
          <AvatarFallback className="text-base font-semibold uppercase">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-foreground flex items-center gap-1 text-base font-semibold tracking-tight">
            <span className="truncate">{displayName}</span>
            <ChevronRight
              className="text-muted-foreground size-4 shrink-0 opacity-70"
              aria-hidden
            />
          </div>
          {subtitle ? (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-snug">
              {subtitle}
            </p>
          ) : null}
          {me?.role?.name ? (
            <span className="bg-primary/15 text-primary mt-2 inline-flex max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-medium">
              {me.role.name}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type AccountMenuLabels = {
  myAccount: string;
  myWallet: string;
  signOut: string;
};

type AccountMenuPanelProps = {
  me: MeResponse | null | undefined;
  displayName: string;
  initials: string;
  photoAlt: string;
  labels: AccountMenuLabels;
  onMyAccount: () => void;
  onMyWallet: () => void;
  onSignOut: () => void;
};

function AccountMenuPanel({
  me,
  displayName,
  initials,
  photoAlt,
  labels,
  onMyAccount,
  onMyWallet,
  onSignOut,
}: AccountMenuPanelProps) {
  return (
    <DropdownMenuContent
      align="end"
      sideOffset={ACCOUNT_MENU_SIDE_OFFSET}
      className={`bg-card text-card-foreground ${ACCOUNT_MENU_WIDTH_CLASS} rounded-2xl border p-0 shadow-xl ring-0`}
    >
      <AccountMenuProfileHeader
        me={me}
        displayName={displayName}
        initials={initials}
        photoAlt={photoAlt}
      />
      <div className="p-2">
        <DropdownMenuItem
          className="focus:bg-accent h-11 cursor-pointer rounded-xl px-3"
          onClick={onMyAccount}
        >
          <UserCircle2 className="size-[18px] shrink-0" strokeWidth={1.75} />
          <span>{labels.myAccount}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="focus:bg-accent h-11 cursor-pointer rounded-xl px-3"
          onClick={onMyWallet}
        >
          <Wallet className="size-[18px] shrink-0" strokeWidth={1.75} />
          <span>{labels.myWallet}</span>
        </DropdownMenuItem>
      </div>
      <ThemeSwitcher />
      <LanguageSwitcher />
      <div className="border-border bg-muted/25 rounded-b-2xl border-t p-2">
        <DropdownMenuItem
          variant="destructive"
          className="h-11 cursor-pointer rounded-xl px-3"
          onClick={onSignOut}
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} />
          <span>{labels.signOut}</span>
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  );
}

type AccountMenuDropdownProps = {
  me: MeResponse | null | undefined;
};

export function AccountMenuDropdown({ me }: AccountMenuDropdownProps) {
  const t = useTranslations('account');
  const { openMyAccountSheet } = useMyAccountSheet();
  const { openMyWalletSheet } = useMyWalletSheet();
  const displayName = displayNameFromMe(me, t('fallbackAccountName'));
  const initials = initialsFromMe(me);
  const photo = me?.avatar?.trim();
  const photoAlt = t('profilePhotoAlt', { name: displayName });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={t('accountMenuAria', { name: displayName })}
        className="border-border bg-muted/30 text-foreground hover:bg-muted/55 focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full border p-0 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Avatar className="size-8 shadow-sm" size="default">
          {photo ? (
            <AvatarImage src={photo} alt={photoAlt} loading="eager" decoding="async" />
          ) : null}
          <AvatarFallback className="text-foreground text-xs font-semibold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <AccountMenuPanel
        me={me}
        displayName={displayName}
        initials={initials}
        photoAlt={photoAlt}
        labels={{
          myAccount: t('myAccount'),
          myWallet: t('myWallet'),
          signOut: t('signOut'),
        }}
        onMyAccount={() => void openMyAccountSheet()}
        onMyWallet={() => openMyWalletSheet()}
        onSignOut={() => void signOutClient()}
      />
    </DropdownMenu>
  );
}
