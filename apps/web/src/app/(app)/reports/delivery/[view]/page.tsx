import { redirect } from 'next/navigation';
import { ReportsCenter } from '@/features/reports/components/ReportsCenter';
import { REPORTS_SECTION_DEFAULTS } from '@/lib/navigation/module-last-visit/reports-visit-config';

const DELIVERY_VIEWS = new Set(['projects', 'specialists']);

export default async function ReportsDeliveryViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!DELIVERY_VIEWS.has(view)) {
    redirect(REPORTS_SECTION_DEFAULTS.delivery);
  }
  return <ReportsCenter />;
}
