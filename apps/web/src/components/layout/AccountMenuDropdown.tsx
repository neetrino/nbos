'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, UserCircle2, Wallet } from 'lucide-react';
import { signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { MeResponse } from '@/lib/permissions/types';
import {
  ACCOUNT_MENU_SIDE_OFFSET,
  ACCOUNT_MENU_WIDTH_CLASS,
} from './account-menu-dropdown-constants';

function displayNameFromMe(me: MeResponse | null | undefined): string {
  if (me?.firstName && me?.lastName) {
    return `${me.firstName} ${me.lastName}`;
  }
  return me?.firstName ?? me?.email ?? 'My Account';
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
};

function AccountMenuProfileHeader({ me, displayName, initials }: ProfileHeaderProps) {
  const photo = me?.avatar?.trim();
  const subtitle = me?.position?.trim() || me?.email?.trim();

  return (
    <div className="border-border from-muted/50 rounded-t-2xl border-b bg-gradient-to-b to-transparent px-4 pt-5 pb-4">
      <div className="flex gap-3">
        <Avatar size="lg" className="size-12 shadow-sm">
          {photo ? <AvatarImage src={photo} alt={`${displayName} profile photo`} /> : null}
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

type AccountMenuPanelProps = {
  me: MeResponse | null | undefined;
  displayName: string;
  initials: string;
  onMyAccount: () => void;
  onMyWallet: () => void;
  onSignOut: () => void;
};

function AccountMenuPanel({
  me,
  displayName,
  initials,
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
      <AccountMenuProfileHeader me={me} displayName={displayName} initials={initials} />
      <div className="p-2">
        <DropdownMenuItem
          className="focus:bg-accent h-11 cursor-pointer rounded-xl px-3"
          onClick={onMyAccount}
        >
          <UserCircle2 className="size-[18px] shrink-0" strokeWidth={1.75} />
          <span>My Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="focus:bg-accent h-11 cursor-pointer rounded-xl px-3"
          onClick={onMyWallet}
        >
          <Wallet className="size-[18px] shrink-0" strokeWidth={1.75} />
          <span>My wallet</span>
        </DropdownMenuItem>
      </div>
      <div className="border-border bg-muted/25 rounded-b-2xl border-t p-2">
        <DropdownMenuItem
          variant="destructive"
          className="h-11 cursor-pointer rounded-xl px-3"
          onClick={onSignOut}
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  );
}

type AccountMenuDropdownProps = {
  me: MeResponse | null | undefined;
};

export function AccountMenuDropdown({ me }: AccountMenuDropdownProps) {
  const router = useRouter();
  const displayName = displayNameFromMe(me);
  const initials = initialsFromMe(me);
  const photo = me?.avatar?.trim();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`Account menu: ${displayName}`}
        className="border-border bg-muted/30 text-foreground hover:bg-muted/55 focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full border p-0 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Avatar className="size-8 shadow-sm" size="default">
          {photo ? <AvatarImage src={photo} alt={`${displayName} profile photo`} /> : null}
          <AvatarFallback className="text-foreground text-xs font-semibold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <AccountMenuPanel
        me={me}
        displayName={displayName}
        initials={initials}
        onMyAccount={() => router.push('/my-account')}
        onMyWallet={() => router.push('/my-account/wallet')}
        onSignOut={() => signOut({ callbackUrl: '/sign-in' })}
      />
    </DropdownMenu>
  );
}
