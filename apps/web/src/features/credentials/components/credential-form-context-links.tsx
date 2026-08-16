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
      className="text-foreground hover:text-primary inline-flex max-w-full min-w-0 items-center gap-1.5 text-sm font-medium transition-colors"
    >
      <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
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
    <section className="border-border space-y-2 border-t pt-4" aria-label="Context links">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Context links
      </h3>
      <div className="flex flex-col gap-2">
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
