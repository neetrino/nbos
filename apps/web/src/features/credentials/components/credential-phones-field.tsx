'use client';

import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface CredentialPhonesFieldProps {
  phones: string[];
  onChange: (phones: string[]) => void;
  required?: boolean;
}

export function CredentialPhonesField({ phones, onChange, required }: CredentialPhonesFieldProps) {
  const updateAt = (index: number, value: string) => {
    const next = [...phones];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(phones.filter((_, i) => i !== index));
  };

  const addPhone = () => onChange([...phones, '']);

  const rows = phones.length > 0 ? phones : [''];

  return (
    <div className="group grid gap-2">
      <Label>{required ? 'Phone (2FA) *' : 'Phone (2FA)'}</Label>
      {rows.map((value, index) => (
        <div key={`phone-row-${index}`} className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => updateAt(index, e.target.value)}
            placeholder="+374 …"
            autoComplete="off"
          />
          {rows.length > 1 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => removeAt(index)}>
              Remove
            </Button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={addPhone}
        className="text-primary flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Plus className="size-3.5" />
        Add phone
      </button>
    </div>
  );
}
