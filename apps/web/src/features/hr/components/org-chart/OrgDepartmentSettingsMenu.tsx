'use client';

import { type ReactNode } from 'react';
import {
  ArrowLeftRight,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  UserRoundPlus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type OrgDepartmentSettingsAction =
  | 'edit'
  | 'addChild'
  | 'addMember'
  | 'transferIn'
  | 'invite'
  | 'delete';

export function OrgDepartmentSettingsMenu({
  canEdit,
  canAdd,
  canDelete,
  onAction,
}: {
  canEdit: boolean;
  canAdd: boolean;
  canDelete: boolean;
  onAction: (action: OrgDepartmentSettingsAction) => void;
}) {
  const t = useTranslations('hr');
  if (!canEdit && !canAdd && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={t('orgChart.deptSettings.menuAria')}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1.5 shadow-lg">
        {canEdit ? (
          <SettingsItem
            icon={<Pencil className="size-4 text-sky-600" aria-hidden />}
            title={t('orgChart.deptSettings.edit')}
            description={t('orgChart.deptSettings.editHint')}
            onSelect={() => onAction('edit')}
          />
        ) : null}
        {canAdd ? (
          <SettingsItem
            icon={<FolderPlus className="size-4 text-sky-600" aria-hidden />}
            title={t('orgChart.deptSettings.addChild')}
            description={t('orgChart.deptSettings.addChildHint')}
            onSelect={() => onAction('addChild')}
          />
        ) : null}
        {canEdit ? (
          <>
            <DropdownMenuSeparator />
            <SettingsItem
              icon={<UserPlus className="size-4 text-sky-600" aria-hidden />}
              title={t('orgChart.deptSettings.addMember')}
              description={t('orgChart.deptSettings.addMemberHint')}
              onSelect={() => onAction('addMember')}
            />
            <SettingsItem
              icon={<ArrowLeftRight className="size-4 text-sky-600" aria-hidden />}
              title={t('orgChart.deptSettings.transferIn')}
              description={t('orgChart.deptSettings.transferInHint')}
              onSelect={() => onAction('transferIn')}
            />
          </>
        ) : null}
        {canAdd ? (
          <SettingsItem
            icon={<UserRoundPlus className="size-4 text-sky-600" aria-hidden />}
            title={t('orgChart.deptSettings.invite')}
            description={t('orgChart.deptSettings.inviteHint')}
            onSelect={() => onAction('invite')}
          />
        ) : null}
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <SettingsItem
              icon={<Trash2 className="text-destructive size-4" aria-hidden />}
              title={t('orgChart.deptSettings.delete')}
              description={t('orgChart.deptSettings.deleteHint')}
              destructive
              onSelect={() => onAction('delete')}
            />
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingsItem({
  icon,
  title,
  description,
  destructive = false,
  onSelect,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  destructive?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      variant={destructive ? 'destructive' : 'default'}
      className="items-start gap-3 rounded-xl px-2.5 py-2.5"
      onClick={onSelect}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="flex min-w-0 flex-col gap-0.5 text-left">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-muted-foreground text-xs leading-snug whitespace-normal">
          {description}
        </span>
      </span>
    </DropdownMenuItem>
  );
}
