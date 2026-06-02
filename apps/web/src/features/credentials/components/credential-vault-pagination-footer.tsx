'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  buildCredentialVaultPageSequence,
  CREDENTIAL_VAULT_PAGE_SIZE_OPTIONS,
  type CredentialVaultPageSizeOption,
} from '@/features/credentials/constants/credential-vault-pagination';

export interface CredentialVaultPaginationFooterProps {
  page: number;
  pageSize: CredentialVaultPageSizeOption;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: CredentialVaultPageSizeOption) => void;
}

export function CredentialVaultPaginationFooter({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: CredentialVaultPaginationFooterProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageSequence = buildCredentialVaultPageSequence(page, totalPages);

  return (
    <div className="border-border flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground text-xs tabular-nums">
        {start}–{end} of {total}
      </span>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          {pageSequence.map((entry, index) =>
            entry === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="text-muted-foreground px-1 text-xs tabular-nums"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={entry}
                type="button"
                variant={entry === page ? 'default' : 'outline'}
                size="sm"
                className={cn('min-w-9 tabular-nums')}
                aria-current={entry === page ? 'page' : undefined}
                onClick={() => onPageChange(entry)}
              >
                {entry}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs tabular-nums sm:justify-center">
          Page 1 of 1
        </span>
      )}

      <label className="flex items-center justify-end gap-2 sm:min-w-[140px]">
        <span className="text-muted-foreground text-xs">Per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) =>
            onPageSizeChange(Number(value) as CredentialVaultPageSizeOption)
          }
        >
          <SelectTrigger className="h-8 w-[88px]" aria-label="Credentials per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {CREDENTIAL_VAULT_PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
