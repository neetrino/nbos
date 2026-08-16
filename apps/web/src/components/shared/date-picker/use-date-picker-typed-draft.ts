'use client';

import { useCallback, useState } from 'react';
import {
  EMPTY_TYPED_DATE_PARTS,
  formatTypedDateParts,
  parseTypedDateParts,
  sanitizeTypedDatePart,
  shouldAdvanceTypedDatePart,
  type TypedDatePartKey,
} from './date-picker-typed';

export function useDatePickerTypedDraft() {
  const [typedDraft, setTypedDraft] = useState(EMPTY_TYPED_DATE_PARTS);

  const resetTypedDraft = useCallback((parsed: Date | undefined) => {
    setTypedDraft(parsed ? formatTypedDateParts(parsed) : EMPTY_TYPED_DATE_PARTS);
  }, []);

  const handlePartChange = useCallback(
    (part: TypedDatePartKey, raw: string, onValidDate: (date: Date) => void) => {
      const digits = sanitizeTypedDatePart(part, raw);
      const next = { ...typedDraft, [part]: digits };
      setTypedDraft(next);
      const date = parseTypedDateParts(next);
      if (date) onValidDate(date);
      return shouldAdvanceTypedDatePart(part, digits);
    },
    [typedDraft],
  );

  const commitTypedDraft = useCallback(
    (onValidDate: (date: Date) => void) => {
      const date = parseTypedDateParts(typedDraft);
      if (date) onValidDate(date);
    },
    [typedDraft],
  );

  return { typedDraft, resetTypedDraft, handlePartChange, commitTypedDraft };
}
