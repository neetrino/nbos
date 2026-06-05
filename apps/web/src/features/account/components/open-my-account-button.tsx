'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useMyAccountSheet } from '@/features/account/components/my-account-sheet-provider';

interface OpenMyAccountButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  children: ReactNode;
}

export function OpenMyAccountButton({ children, ...props }: OpenMyAccountButtonProps) {
  const { openMyAccountSheet } = useMyAccountSheet();

  return (
    <Button type="button" {...props} onClick={() => void openMyAccountSheet()}>
      {children}
    </Button>
  );
}
