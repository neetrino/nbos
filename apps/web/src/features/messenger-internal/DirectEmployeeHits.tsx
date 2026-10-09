'use client';

import { useEffect, useState } from 'react';
import type { RelationPickerOption } from '@/components/shared/relation-picker/relation-picker.types';
import { searchEmployeesForPicker } from '@/lib/employees';
import { MessengerPersonAvatar } from './MessengerPersonAvatar';

const DIRECT_EMPLOYEE_RESULT_LIMIT = 8;

export function DirectEmployeeHits({
  query,
  selfId,
  onOpen,
}: {
  query: string;
  selfId?: string;
  onOpen: (employee: { id: string; name: string }) => void;
}) {
  const people = useEmployeeHits(query, selfId);
  if (people.length === 0) return null;
  return (
    <ul className="mb-2 flex flex-col gap-1">
      {people.map((person) => (
        <li key={person.value}>
          <button
            type="button"
            onClick={() => onOpen({ id: person.value, name: person.label })}
            className="hover:bg-card flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm"
          >
            <MessengerPersonAvatar
              employeeId={person.value}
              label={person.label}
              sizeClassName="size-9"
              fallbackClassName="bg-[#fef3c7] text-[#92400e]"
            />
            <span className="text-foreground min-w-0 truncate font-medium">{person.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function useEmployeeHits(query: string, selfId?: string): RelationPickerOption[] {
  const term = query.trim();
  const [people, setPeople] = useState<RelationPickerOption[]>([]);
  useEffect(() => {
    if (!term) return;
    let cancelled = false;
    const exclude = selfId ? new Set([selfId]) : undefined;
    void searchEmployeesForPicker(term, exclude).then((rows) => {
      if (!cancelled) setPeople(rows.slice(0, DIRECT_EMPLOYEE_RESULT_LIMIT));
    });
    return () => {
      cancelled = true;
    };
  }, [term, selfId]);
  if (!term) return [];
  return people;
}
