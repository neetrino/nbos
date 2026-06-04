import { redirect } from 'next/navigation';
import { ReportsCenter } from '@/features/reports/components/ReportsCenter';
import { REPORTS_SECTION_DEFAULTS } from '@/lib/navigation/module-last-visit/reports-visit-config';

const GROWTH_VIEWS = new Set(['sales', 'marketing']);

export default async function ReportsGrowthViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!GROWTH_VIEWS.has(view)) {
    redirect(REPORTS_SECTION_DEFAULTS.growth);
  }
  return <ReportsCenter />;
}
