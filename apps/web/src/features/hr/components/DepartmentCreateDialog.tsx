'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DepartmentItem } from '@/lib/api/employees';

export function slugFromDepartmentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function DepartmentCreateDialog({
  open,
  departments,
  formName,
  formSlug,
  formDescription,
  formParentId,
  saving,
  onOpenChange,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
  onParentIdChange,
  onCreate,
}: {
  open: boolean;
  departments: DepartmentItem[];
  formName: string;
  formSlug: string;
  formDescription: string;
  formParentId: string;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  onDescriptionChange: (value: string) => void;
  onParentIdChange: (parentId: string) => void;
  onCreate: () => void;
}) {
  const t = useTranslations('hr');
  const tCommon = useTranslations('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deptAdmin.dialogTitle')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <DialogField id="name" label={t('deptAdmin.name')}>
            <Input
              id="name"
              value={formName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={t('deptAdmin.namePlaceholder')}
            />
          </DialogField>
          <DialogField id="slug" label={t('deptAdmin.slug')}>
            <Input
              id="slug"
              value={formSlug}
              onChange={(event) => onSlugChange(event.target.value)}
              placeholder={t('deptAdmin.slugPlaceholder')}
            />
          </DialogField>
          <DialogField id="description" label={t('deptAdmin.description')}>
            <Input
              id="description"
              value={formDescription}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder={t('deptAdmin.descriptionPlaceholder')}
            />
          </DialogField>
          <DialogField id="parent" label={t('deptAdmin.parent')}>
            <Select
              value={formParentId || 'none'}
              onValueChange={(value) => onParentIdChange(value === 'none' || !value ? '' : value)}
            >
              <SelectTrigger id="parent">
                <SelectValue placeholder={t('deptAdmin.none')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('deptAdmin.none')}</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={onCreate} disabled={saving}>
            {saving ? tCommon('creating') : tCommon('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
