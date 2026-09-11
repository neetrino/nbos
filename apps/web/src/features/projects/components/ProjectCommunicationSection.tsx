'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildProductDetailPageHref } from '@/features/projects/constants/product-detail-tab';
import { EntityConversationPanel } from '@/features/messenger-internal/EntityConversationPanel';
import type { FullProject } from '@/lib/api/projects';
import { DetailInfoSubsection } from './detail-info-subsection';

export function ProjectCommunicationSection({ project }: { project: FullProject }) {
  const [generalOpen, setGeneralOpen] = useState(false);

  return (
    <DetailInfoSubsection title="Communication" className="shrink-0 pb-3">
      <ul className="space-y-1.5 text-sm">
        {project.products.map((product) => (
          <li key={product.id}>
            <Link
              href={buildProductDetailPageHref(project.id, product.id, 'chat')}
              className="text-foreground hover:text-primary inline-flex items-center gap-1.5"
            >
              <MessageSquare size={14} aria-hidden />
              {product.name} Chat
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-2 text-xs">
        Deals keep Internal discussion on the Deal. Task notes live on the Task Card and in
        Messenger Tasks.
      </p>
      {generalOpen ? (
        <div className="mt-3 flex min-h-[16rem] min-w-0 flex-col">
          <EntityConversationPanel kind="project-general" entityId={project.id} />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setGeneralOpen(true)}
        >
          Open Project General
        </Button>
      )}
    </DetailInfoSubsection>
  );
}
