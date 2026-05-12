import { ClientPortfolioView } from '@/features/clients/components/client-portfolio/ClientPortfolioView';

interface PageProps {
  params: Promise<{ contactId: string }>;
}

export default async function ContactPortfolioPage({ params }: PageProps) {
  const { contactId } = await params;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ClientPortfolioView variant="contact" entityId={contactId} />
    </div>
  );
}
