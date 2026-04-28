import { Plus, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExtensionsEmptyStateProps {
  onCreateClick: () => void;
}

export function ExtensionsEmptyState({ onCreateClick }: ExtensionsEmptyStateProps) {
  return (
    <div className="text-muted-foreground py-12 text-center">
      <Puzzle size={40} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">No extensions in this project yet.</p>
      <Button variant="outline" size="sm" onClick={onCreateClick} className="mt-3 gap-1.5">
        <Plus size={14} />
        Create First Extension
      </Button>
    </div>
  );
}
