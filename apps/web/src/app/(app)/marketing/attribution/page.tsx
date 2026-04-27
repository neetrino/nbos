'use client';

import { GitBranch } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function AttributionReviewPage() {
  return (
    <ModulePlaceholder
      title="Attribution Review"
      description="Manual review surface for lead source quality, missing attribution, and marketing-to-CRM handoff."
      emptyTitle="Attribution review is not configured yet"
      emptyDescription="This route is ready for the Marketing phase and intentionally avoids calculating CPL or ROI without spend data."
      icon={GitBranch}
    />
  );
}
