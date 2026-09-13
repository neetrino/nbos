import { redirect } from 'next/navigation';

/**
 * Compatibility route. Departments belong to My Company, not to Settings / Admin, so the
 * legacy Settings URL only forwards. Without this the page would sit under `/settings`
 * while being readable with `COMPANY VIEW`, contradicting the Settings lockdown.
 */
export default function SettingsDepartmentsRedirectPage() {
  redirect('/my-company/departments');
}
