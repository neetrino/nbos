'use client';

import { cn } from '@/lib/utils';
import { COLOR_PALETTE } from './kanban.types';

interface KanbanColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function KanbanColorPicker({ value, onChange }: KanbanColorPickerProps) {
  return (
    <div className="border-border bg-popover absolute top-full left-0 z-50 mt-1 grid grid-cols-6 gap-1 rounded-lg border p-2 shadow-lg">
      {COLOR_PALETTE.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            'h-5 w-5 rounded-sm border transition-transform hover:scale-110',
            value === c ? 'ring-primary ring-2 ring-offset-1' : 'border-transparent',
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
