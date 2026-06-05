import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';

export function PartnerDirectionIcon({ direction }: { direction: string }) {
  if (direction === 'INBOUND') {
    return <ArrowDownLeft size={12} className="text-green-500" aria-hidden />;
  }
  if (direction === 'OUTBOUND') {
    return <ArrowUpRight size={12} className="text-blue-500" aria-hidden />;
  }
  return <ArrowLeftRight size={12} className="text-purple-500" aria-hidden />;
}
