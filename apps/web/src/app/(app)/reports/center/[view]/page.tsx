import { redirect } from 'next/navigation';
import { ReportsCenter } from '@/features/reports/components/ReportsCenter';
import { buildReportsViewPath, isLiveReportsCenterSlug } from '@/features/reports/reports-routing';

export default async function ReportsCenterViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!isLiveReportsCenterSlug(view)) {
    redirect(buildReportsViewPath('EXPORTS'));
  }
  return <ReportsCenter />;
}
