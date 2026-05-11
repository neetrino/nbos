'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, XIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { SheetClose } from '@/components/ui/sheet';
import { DetailSheetSettingsMenu } from '@/components/shared';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DeliveryItemDetailHeaderProps {
  title: string;
  entityKind: 'PRODUCT' | 'EXTENSION';
  projectCode: string;
  projectName: string;
  projectHref: string;
  workspaceHref: string;
  deadline: string | null;
  loading: boolean;
  onCommitTitle: (trimmed: string) => Promise<void>;
}

export function DeliveryItemDetailHeader({
  title,
  entityKind,
  projectCode,
  projectName,
  projectHref,
  workspaceHref,
  deadline,
  loading,
  onCommitTitle,
}: DeliveryItemDetailHeaderProps) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const deadlineRisk = getDeadlineRisk(deadline);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const startEditing = () => {
    if (loading) return;
    setNameValue(title);
    setEditingName(true);
  };

  const saveName = () => {
    const trimmed = nameValue.trim();
    setEditingName(false);
    if (trimmed && trimmed !== title) {
      void onCommitTitle(trimmed);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    }
    if (e.key === 'Escape') {
      setEditingName(false);
    }
  };

  return (
    <div className="shrink-0 border-b border-stone-100 bg-gradient-to-br from-amber-50/50 via-white to-white px-7 pt-5 pb-3 dark:border-stone-800 dark:from-amber-950/10 dark:via-transparent dark:to-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
              {entityKind === 'PRODUCT' ? 'Product' : 'Extension'}
            </span>
          </div>
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={handleNameKeyDown}
              placeholder="Name…"
              className="text-foreground mt-2 w-full border-0 border-b-2 border-amber-400 bg-transparent text-xl font-bold tracking-tight outline-none placeholder:text-stone-300"
            />
          ) : (
            <h2
              onClick={startEditing}
              className={cn(
                'text-foreground -mx-1 mt-2 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors',
                loading ? 'cursor-default' : 'hover:bg-stone-100 dark:hover:bg-stone-800',
              )}
              title={loading ? undefined : 'Click to edit name'}
            >
              {loading ? '…' : title}
            </h2>
          )}
          <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wider">
            <Link
              href={projectHref}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {projectCode}
            </Link>
            <span className="text-muted-foreground/80"> · </span>
            <span>{projectName}</span>
          </p>
          {deadline ? (
            <p
              className={cn('mt-1 text-xs font-medium', deadlineRisk.className)}
              title="Delivery deadline"
            >
              Deadline: {new Date(deadline).toLocaleDateString()}
              {deadlineRisk.label ? ` · ${deadlineRisk.label}` : ''}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {workspaceHref && workspaceHref !== '#' ? (
            <DetailSheetSettingsMenu>
              <DropdownMenuItem onClick={() => router.push(workspaceHref)}>
                <ExternalLink />
                Open workspace
              </DropdownMenuItem>
            </DetailSheetSettingsMenu>
          ) : null}
          <SheetClose
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
              'text-muted-foreground shrink-0',
            )}
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>
      </div>
    </div>
  );
}

function getDeadlineRisk(deadline: string | null): { label: string; className: string } {
  if (!deadline) return { label: '', className: '' };
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return { label: '', className: 'text-muted-foreground' };
  const now = new Date();
  if (d.getTime() < now.getTime()) {
    return { label: 'Overdue', className: 'text-destructive' };
  }
  const days = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 7) {
    return { label: 'Due soon', className: 'text-amber-700 dark:text-amber-400' };
  }
  return { label: '', className: 'text-muted-foreground' };
}
