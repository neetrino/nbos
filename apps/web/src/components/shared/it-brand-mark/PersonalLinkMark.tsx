import { Link2 } from 'lucide-react';
import { resolveItBrandMark } from '@/lib/it-brand-marks/resolve-it-brand-mark';
import { ItBrandMarkIcon } from './ItBrandMarkIcon';

interface PersonalLinkMarkProps {
  url: string;
  label: string;
  className?: string;
}

/** Brand mark for a personal link, or the generic chain icon when unknown. */
export function PersonalLinkMark({ url, label, className }: PersonalLinkMarkProps) {
  const mark = resolveItBrandMark(url, label);
  if (mark) return <ItBrandMarkIcon mark={mark} className={className} />;
  return <Link2 aria-hidden className={className} />;
}
