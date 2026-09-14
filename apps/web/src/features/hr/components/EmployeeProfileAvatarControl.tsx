'use client';

import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { EMPLOYEE_AVATAR_ACCEPT } from '@/features/hr/constants/employee-avatar';
import type { Employee } from '@/lib/api/employees';
import { cn } from '@/lib/utils';
import { useEmployeeAvatarEditor } from './use-employee-avatar-editor';

interface EmployeeProfileAvatarControlProps {
  employee: Employee;
  canEdit: boolean;
  selfProfile: boolean;
  onUpdated: (employee: Employee) => void | Promise<void>;
}

export function EmployeeProfileAvatarControl({
  employee,
  canEdit,
  selfProfile,
  onUpdated,
}: EmployeeProfileAvatarControlProps) {
  const t = useTranslations('hr.sheet');
  const inputRef = useRef<HTMLInputElement>(null);
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  const hasPhoto = Boolean(employee.avatar?.trim());
  const editor = useEmployeeAvatarEditor({
    employeeId: employee.id,
    selfProfile,
    photoUpdated: t('photoUpdated'),
    photoFailed: t('photoFailed'),
    photoTooLarge: t('photoTooLarge'),
    onUpdated,
  });

  if (!canEdit) {
    return (
      <EmployeePersonAvatar
        label={fullName}
        imageUrl={employee.avatar}
        className="size-11 text-base"
      />
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
        disabled={editor.busy}
        aria-label={t('changePhotoAria')}
        onClick={() => inputRef.current?.click()}
      >
        <EmployeePersonAvatar
          label={fullName}
          imageUrl={employee.avatar}
          className="size-11 text-base"
        />
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white',
            'opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100',
            editor.busy && 'opacity-100',
          )}
        >
          <Camera className="size-4" aria-hidden />
        </span>
      </button>
      {hasPhoto ? (
        <button
          type="button"
          className="bg-background text-muted-foreground hover:text-destructive absolute -top-1 -right-1 rounded-full border p-0.5"
          disabled={editor.busy}
          aria-label={t('removePhotoAria')}
          onClick={editor.onRemove}
        >
          <X className="size-3" aria-hidden />
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={EMPLOYEE_AVATAR_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          editor.onFilePicked(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
