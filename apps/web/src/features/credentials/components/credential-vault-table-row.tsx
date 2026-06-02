'use client';

import {
  Pencil,
  Trash2,
  RotateCcw,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  FolderKanban,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import {
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialHealthBadge } from '@/features/credentials/utils/credential-health-badge';
import { credentialsApi } from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

export interface CredentialVaultTableRowProps {
  cred: CredentialListItem;
  isArchivedList: boolean;
  isLoginVisible: boolean;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
  onOpenCredential: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string) => void;
  onRestored: () => void;
}

export function CredentialVaultTableRow({
  cred,
  isArchivedList,
  isLoginVisible,
  onToggleLogin,
  onCopy,
  onOpenCredential,
  onRequestDelete,
  onRequestPurge,
  onRestored,
}: CredentialVaultTableRowProps) {
  const access = getAccessLevel(cred.accessLevel);
  const criticality = getCredentialCriticality(cred.criticality);
  const healthBadge = credentialHealthBadge(cred.health);

  return (
    <TableRow className="cursor-pointer" onClick={() => onOpenCredential(cred.id)}>
      <TableCell>
        <div className="flex items-center gap-2">
          <KeyRound size={14} className="text-muted-foreground" />
          <span className="font-medium">{cred.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-xs">{cred.category}</TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {cred.credentialType.replaceAll('_', ' ')}
      </TableCell>
      <TableCell>
        {criticality && <StatusBadge label={criticality.label} variant={criticality.variant} />}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">{cred.provider ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="font-mono text-xs">
            {cred.login ? (isLoginVisible ? cred.login : '••••••••') : '—'}
          </span>
          {cred.login && (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon-sm" onClick={() => onToggleLogin(cred.id)}>
                {isLoginVisible ? <EyeOff size={12} /> : <Eye size={12} />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onCopy(cred.login!)}>
                <Copy size={12} />
              </Button>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {access && (
          <div className="flex items-center gap-1">
            <Shield size={11} className="text-muted-foreground" />
            <StatusBadge label={access.label} variant={access.variant} />
          </div>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {cred.owner ? `${cred.owner.firstName} ${cred.owner.lastName}` : '—'}
      </TableCell>
      <TableCell>
        {cred.project ? (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <FolderKanban size={10} />
            {cred.project.name}
          </div>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">
            {cred.nextRotationAt ? new Date(cred.nextRotationAt).toLocaleDateString() : 'No date'}
          </span>
          {healthBadge && <StatusBadge label={healthBadge.label} variant={healthBadge.variant} />}
        </div>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <CredentialVaultTableUrlCell cred={cred} isArchivedList={isArchivedList} />
      </TableCell>
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <CredentialVaultTableActionsCell
          cred={cred}
          isArchivedList={isArchivedList}
          onOpenCredential={onOpenCredential}
          onRequestDelete={onRequestDelete}
          onRequestPurge={onRequestPurge}
          onRestored={onRestored}
        />
      </TableCell>
    </TableRow>
  );
}

function CredentialVaultTableUrlCell({
  cred,
  isArchivedList,
}: {
  cred: CredentialListItem;
  isArchivedList: boolean;
}) {
  if (cred.url && !isArchivedList) {
    return (
      <Button
        type="button"
        variant="link"
        className="text-accent h-auto gap-1 p-0 text-xs"
        onClick={() => {
          void (async () => {
            try {
              const { url } = await credentialsApi.recordUrlOpened(cred.id);
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch {
              toast.error('Could not open URL');
            }
          })();
        }}
      >
        <ExternalLink size={10} />
        Open
      </Button>
    );
  }
  if (cred.url && isArchivedList) {
    return <span className="text-muted-foreground text-xs break-all">{cred.url}</span>;
  }
  return <>—</>;
}

function CredentialVaultTableActionsCell({
  cred,
  isArchivedList,
  onOpenCredential,
  onRequestDelete,
  onRequestPurge,
  onRestored,
}: {
  cred: CredentialListItem;
  isArchivedList: boolean;
  onOpenCredential: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string) => void;
  onRestored: () => void;
}) {
  if (isArchivedList) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <PermissionGate module="CREDENTIALS" action="EDIT">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() => {
              void (async () => {
                try {
                  await credentialsApi.restore(cred.id);
                  toast.success('Credential restored');
                  onRestored();
                } catch {
                  toast.error('Could not restore');
                }
              })();
            }}
          >
            <RotateCcw size={12} />
            Restore
          </Button>
        </PermissionGate>
        <PermissionGate module="CREDENTIALS" action="DELETE">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10 h-8"
            onClick={() => onRequestPurge(cred.id, cred.name)}
          >
            Erase
          </Button>
        </PermissionGate>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-0.5">
      <PermissionGate module="CREDENTIALS" action="EDIT">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Open credential"
          onClick={() => onOpenCredential(cred.id)}
        >
          <Pencil size={12} />
        </Button>
      </PermissionGate>
      <PermissionGate module="CREDENTIALS" action="DELETE">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Archive credential"
          className="text-destructive hover:text-destructive"
          onClick={() => onRequestDelete(cred.id, cred.name)}
        >
          <Trash2 size={12} />
        </Button>
      </PermissionGate>
    </div>
  );
}
