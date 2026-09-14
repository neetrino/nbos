import { useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { EMPLOYEE_AVATAR_MAX_BYTES } from '@/features/hr/constants/employee-avatar';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { meApi } from '@/lib/api/me';

export function useEmployeeAvatarEditor(input: {
  employeeId: string;
  selfProfile: boolean;
  photoUpdated: string;
  photoFailed: string;
  photoTooLarge: string;
  onUpdated: (employee: Employee) => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function persist(next: Promise<Employee>) {
    setBusy(true);
    try {
      await input.onUpdated(await next);
      toast.success(input.photoUpdated);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, input.photoFailed));
    } finally {
      setBusy(false);
    }
  }

  function onFilePicked(file: File | undefined) {
    if (!file || busy) return;
    if (file.size > EMPLOYEE_AVATAR_MAX_BYTES) {
      toast.error(input.photoTooLarge);
      return;
    }
    const upload = input.selfProfile
      ? meApi.uploadAvatar(file)
      : employeesApi.uploadAvatar(input.employeeId, file);
    void persist(upload);
  }

  function onRemove() {
    const remove = input.selfProfile
      ? meApi.removeAvatar()
      : employeesApi.removeAvatar(input.employeeId);
    void persist(remove);
  }

  return { busy, onFilePicked, onRemove };
}
