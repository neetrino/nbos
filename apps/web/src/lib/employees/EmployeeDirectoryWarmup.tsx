'use client';

import { useEffect } from 'react';
import { prefetchEmployeePickerEmptyPage } from './employee-directory-cache';

/** Prefetch first employee picker page (20 rows) so empty search opens fast. */
export function EmployeeDirectoryWarmup() {
  useEffect(() => {
    prefetchEmployeePickerEmptyPage();
  }, []);
  return null;
}
