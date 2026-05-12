import { ClientPortfolioView } from '@/features/clients/components/client-portfolio/ClientPortfolioView';

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CompanyPortfolioPage({ params }: PageProps) {
  const { companyId } = await params;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ClientPortfolioView variant="company" entityId={companyId} />
    </div>
  );
}
