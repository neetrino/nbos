'use client';

import type { ReactNode } from 'react';
import { FolderKanban, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DetailSheetEntityLinkGrid,
  DetailSheetSection,
  RelationPickerField,
} from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import type { RelationEntityKind } from '@/components/shared/relation-picker/relation-picker.types';

const emptyRelationSearch = async () => [];

export interface CredentialFormContextLinksProps {
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  productId?: string | null;
  product?: { id: string; name: string } | null;
}

export function CredentialFormContextLinks({
  projectId,
  project,
  productId,
  product,
}: CredentialFormContextLinksProps) {
  const t = useTranslations('credentials');
  const relations = useEntityRelations();
  const resolvedProjectId = projectId ?? project?.id ?? null;
  const productRecord =
    product ?? (productId && resolvedProjectId ? { id: productId, name: 'Product' } : null);

  if (!productRecord && !project) {
    return null;
  }

  return (
    <DetailSheetSection title={t('form.sectionLinked')} outlined>
      <DetailSheetEntityLinkGrid className="sm:grid-cols-2">
        {project ? (
          <LinkedReadonlyField
            label={t('table.project')}
            entityKind="project"
            value={project.id}
            selectionLabel={project.name}
            icon={<FolderKanban size={12} />}
            onOpen={() => relations.openEntity('project', project.id)}
          />
        ) : null}
        {productRecord ? (
          <LinkedReadonlyField
            label={t('form.linkedProduct')}
            entityKind="product"
            value={productRecord.id}
            selectionLabel={productRecord.name}
            icon={<Package size={12} />}
            onOpen={() => relations.openEntity('product', productRecord.id)}
          />
        ) : null}
      </DetailSheetEntityLinkGrid>
    </DetailSheetSection>
  );
}

function LinkedReadonlyField({
  label,
  entityKind,
  value,
  selectionLabel,
  icon,
  onOpen,
}: {
  label: string;
  entityKind: RelationEntityKind;
  value: string;
  selectionLabel: string;
  icon: ReactNode;
  onOpen: () => void;
}) {
  return (
    <RelationPickerField
      label={label}
      entityKind={entityKind}
      value={value}
      selectionLabel={selectionLabel}
      icon={icon}
      readOnly
      placeholder={label}
      onSearch={emptyRelationSearch}
      onSelect={() => undefined}
      onOpenSelected={onOpen}
    />
  );
}
