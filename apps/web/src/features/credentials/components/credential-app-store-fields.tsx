'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  type AppStorePlatform,
  urlForAppStorePlatform,
} from '@/features/credentials/constants/credential-app-store-platform';
import { CredentialPhonesField } from './credential-phones-field';
import { ApplePlatformIcon, GooglePlayPlatformIcon } from './credential-app-store-platform-icons';

export interface CredentialAppStoreFieldsProps {
  platform: AppStorePlatform;
  onPlatformChange: (platform: AppStorePlatform) => void;
  url: string;
  onUrlChange: (url: string) => void;
  phones: string[];
  onPhonesChange: (phones: string[]) => void;
}

export function CredentialAppStoreFields({
  platform,
  onPlatformChange,
  url,
  onUrlChange,
  phones,
  onPhonesChange,
}: CredentialAppStoreFieldsProps) {
  const selectPlatform = (next: AppStorePlatform) => {
    onPlatformChange(next);
    onUrlChange(urlForAppStorePlatform(next));
  };

  return (
    <div className="grid gap-3">
      <Label>Store platform</Label>
      <div className="flex gap-2">
        <PlatformChip
          label="Apple"
          icon={<ApplePlatformIcon />}
          active={platform === 'APPLE'}
          onClick={() => selectPlatform('APPLE')}
        />
        <PlatformChip
          label="Google Play"
          icon={<GooglePlayPlatformIcon />}
          active={platform === 'GOOGLE'}
          onClick={() => selectPlatform('GOOGLE')}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cred-app-store-url">Portal URL</Label>
        <Input id="cred-app-store-url" value={url} readOnly className="bg-muted/40" aria-readonly />
      </div>
      <CredentialPhonesField phones={phones} onChange={onPhonesChange} />
    </div>
  );
}

function PlatformChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-border flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-foreground'
          : 'text-muted-foreground hover:bg-muted/50',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
