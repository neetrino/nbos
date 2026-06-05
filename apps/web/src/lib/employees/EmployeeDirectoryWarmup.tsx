'use client';

import { useEffect } from 'react';
import { prefetchEmployeePickerEmptyPage, prefetchTeamDirectoryDefaultPage } from '@/lib/employees';

/** Warm employee picker + team directory after sign-in. */
export function EmployeeDirectoryWarmup() {
  useEffect(() => {
    prefetchEmployeePickerEmptyPage();
    prefetchTeamDirectoryDefaultPage();
  }, []);
  return null;
}
