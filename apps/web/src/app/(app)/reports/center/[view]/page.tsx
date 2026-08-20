import { redirect } from 'next/navigation';
import { ReportsCenter } from '@/features/reports/components/ReportsCenter';
import { buildReportsViewPath } from '@/features/reports/reports-routing';

const CENTER_VIEWS = new Set(['exports', 'quality']);

export default async function ReportsCenterViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!CENTER_VIEWS.has(view)) {
    redirect(buildReportsViewPath('EXPORTS'));
  }
  return <ReportsCenter />;
}
