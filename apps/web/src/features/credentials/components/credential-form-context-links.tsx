'use client';

import Link from 'next/link';
import { Package, FolderKanban } from 'lucide-react';
import { credentialProductHref } from '@/features/credentials/utils/credential-vault-card-meta';

export interface CredentialFormContextLinksProps {
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  productId?: string | null;
  product?: { id: string; name: string } | null;
}

function ContextLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Package;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function CredentialFormContextLinks({
  projectId,
  project,
  productId,
  product,
}: CredentialFormContextLinksProps) {
  const resolvedProjectId = projectId ?? project?.id ?? null;
  const productRecord =
    product ?? (productId && resolvedProjectId ? { id: productId, name: 'Product' } : null);
  const productHref = credentialProductHref(resolvedProjectId, productRecord);
  const projectHref = project?.id ? `/projects/${project.id}` : null;

  if (!productHref && !projectHref) {
    return null;
  }

  return (
    <section
      className="border-border flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-4"
      aria-label="Context links"
    >
      <span className="text-muted-foreground shrink-0 text-xs">Context</span>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {productHref && productRecord ? (
          <ContextLink href={productHref} icon={Package} label={productRecord.name} />
        ) : null}
        {projectHref && project ? (
          <ContextLink href={projectHref} icon={FolderKanban} label={project.name} />
        ) : null}
      </div>
    </section>
  );
}
