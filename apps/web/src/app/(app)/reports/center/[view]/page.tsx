import { redirect } from 'next/navigation';
import { ReportsCenter } from '@/features/reports/components/ReportsCenter';
import { REPORTS_SECTION_DEFAULTS } from '@/lib/navigation/module-last-visit/reports-visit-config';

const CENTER_VIEWS = new Set(['scheduled', 'exports', 'quality']);

export default async function ReportsCenterViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!CENTER_VIEWS.has(view)) {
    redirect(REPORTS_SECTION_DEFAULTS.center);
  }
  return <ReportsCenter />;
}
