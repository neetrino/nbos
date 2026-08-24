import { useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { companiesApi, type ArmeniaCompanyLookupItem } from '@/lib/api/clients';
import { applyCompanyLookupFill, type CompanyLookupFillTarget } from './apply-company-lookup-fill';

const LOOKUP_NOT_FOUND = 'No company found in the Armenian registry.';
const LOOKUP_FOUND_ONE = 'Found in the registry. Review, then fill empty fields.';
const LOOKUP_FOUND_MANY = 'Several matches. Choose one, then fill empty fields.';

export function presentArmeniaLookupResults(items: ArmeniaCompanyLookupItem[]): {
  matches: ArmeniaCompanyLookupItem[];
  notice: string;
} {
  if (items.length === 0) return { matches: [], notice: LOOKUP_NOT_FOUND };
  return {
    matches: items,
    notice: items.length === 1 ? LOOKUP_FOUND_ONE : LOOKUP_FOUND_MANY,
  };
}

export function useCompanyArmeniaLookup(
  current: CompanyLookupFillTarget,
  onApply: (next: CompanyLookupFillTarget) => void,
) {
  const currentRef = useRef(current);
  currentRef.current = current;
  const inFlightRef = useRef(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [matches, setMatches] = useState<ArmeniaCompanyLookupItem[]>([]);

  const applyMatch = (item: ArmeniaCompanyLookupItem) => {
    const result = applyCompanyLookupFill(currentRef.current, item);
    onApply(result.next);
    setMatches([]);
    setNotice(
      result.filled.length > 0
        ? 'Filled empty fields from the registry. Review before saving.'
        : 'Matching fields already have values. Clear a field if you want the registry value.',
    );
  };

  const runSearch = async () => {
    const q = query.trim();
    if (!q || inFlightRef.current) return;
    const generation = searchGenerationRef.current + 1;
    searchGenerationRef.current = generation;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    setNotice(null);
    setMatches([]);
    try {
      const presented = presentArmeniaLookupResults((await companiesApi.lookup(q)).items);
      if (searchGenerationRef.current !== generation) return;
      setMatches(presented.matches);
      setNotice(presented.notice);
    } catch (caught) {
      if (searchGenerationRef.current !== generation) return;
      setError(
        getApiErrorMessage(caught, 'Armenian registry is unavailable. Fill the form manually.'),
      );
    } finally {
      if (searchGenerationRef.current !== generation) return;
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  const clearQuery = () => {
    searchGenerationRef.current += 1;
    inFlightRef.current = false;
    setQuery('');
    setLoading(false);
    setError(null);
    setNotice(null);
    setMatches([]);
  };

  return {
    query,
    setQuery,
    loading,
    error,
    notice,
    matches,
    runSearch,
    applyMatch,
    clearQuery,
  };
}
