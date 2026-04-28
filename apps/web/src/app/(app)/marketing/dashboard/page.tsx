'use client';

import { useEffect, useState } from 'react';
import { AreaChart, AlertTriangle, RefreshCcw } from 'lucide-react';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { marketingApi, type MarketingAccount, type MarketingActivity } from '@/lib/api/marketing';

export default function MarketingDashboardPage() {
  const [accounts, setAccounts] = useState<MarketingAccount[]>([]);
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [accountData, activityData] = await Promise.all([
        marketingApi.getAccounts(),
        marketingApi.getActivities(),
      ]);
      setAccounts(accountData);
      setActivities(activityData);
      setError(null);
    } catch {
      setError('Marketing dashboard could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const launched = activities.filter((activity) => activity.status === 'LAUNCHED').length;
  const missingFinanceLinks = accounts.filter((account) => !account.financeExpensePlanId).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Dashboard"
        description="Operational marketing snapshot with honest missing-data warnings."
      >
        <Button variant="outline" size="icon" onClick={fetchDashboard}>
          <RefreshCcw size={16} />
        </Button>
      </PageHeader>

      {loading ? (
        <LoadingState variant="cards" count={3} />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchDashboard} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Marketing accounts" value={accounts.length} />
            <MetricCard label="Activities" value={activities.length} />
            <MetricCard label="Launched now" value={launched} />
          </div>

          <div className="border-border bg-card rounded-2xl border p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} />
              Data quality
            </h2>
            {missingFinanceLinks === 0 ? (
              <p className="text-muted-foreground text-sm">
                No missing finance links detected for marketing accounts.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {missingFinanceLinks} accounts are missing Finance Expense Plan links. Attribution
                still works, but CPL/ROI stays hidden until spend exists.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
        <AreaChart size={18} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
