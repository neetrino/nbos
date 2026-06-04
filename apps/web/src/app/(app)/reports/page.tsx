import { redirect } from 'next/navigation';
import { REPORTS_SECTION_DEFAULTS } from '@/lib/navigation/module-last-visit/reports-visit-config';

export default function ReportsIndexPage() {
  redirect(REPORTS_SECTION_DEFAULTS.finance);
}
