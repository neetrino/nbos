'use client';

import {
  Plus,
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { EmptyState, StatusBadge } from '@/components/shared';
import {
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialHealthBadge } from '@/features/credentials/utils/credential-health-badge';
import { credentialsApi } from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

export type VaultListScope = 'active' | 'archived';

export interface CredentialVaultTableProps {
  credentials: CredentialListItem[];
  loading: boolean;
  listScope: VaultListScope;
  visibleLogins: Set<string>;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string) => void;
  onRestored: () => void;
  showCreate: boolean;
}

export function CredentialVaultTable({
  credentials,
  loading,
  listScope,
  visibleLogins,
  onToggleLogin,
  onCopy,
  onCreateOpen,
  onOpenCredential,
  onRequestDelete,
  onRequestPurge,
  onRestored,
  showCreate,
}: CredentialVaultTableProps) {
  const isArchivedList = listScope === 'archived';
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="No credentials"
        description="No credentials match the current filters"
        action={
          showCreate ? (
            <PermissionGate module="CREDENTIALS" action="ADD">
              <Button onClick={onCreateOpen}>
                <Plus size={16} /> Add Credential
              </Button>
            </PermissionGate>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Rotation</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-28 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((cred) => {
            const access = getAccessLevel(cred.accessLevel);
            const criticality = getCredentialCriticality(cred.criticality);
            const healthBadge = credentialHealthBadge(cred.health);
            const isVisible = visibleLogins.has(cred.id);
            return (
              <TableRow
                key={cred.id}
                className="cursor-pointer"
                onClick={() => onOpenCredential(cred.id)}
              >
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
                  {criticality && (
                    <StatusBadge label={criticality.label} variant={criticality.variant} />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {cred.provider ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="font-mono text-xs">
                      {cred.login ? (isVisible ? cred.login : '••••••••') : '—'}
                    </span>
                    {cred.login && (
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onToggleLogin(cred.id)}
                        >
                          {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
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
                      {cred.nextRotationAt
                        ? new Date(cred.nextRotationAt).toLocaleDateString()
                        : 'No date'}
                    </span>
                    {healthBadge && (
                      <StatusBadge label={healthBadge.label} variant={healthBadge.variant} />
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {cred.url && !isArchivedList ? (
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
                  ) : cred.url && isArchivedList ? (
                    <span className="text-muted-foreground text-xs break-all">{cred.url}</span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  {isArchivedList ? (
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
                  ) : (
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
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
