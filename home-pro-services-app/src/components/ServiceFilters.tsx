import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ServiceRecord } from '@/lib/types';

interface ServiceFiltersProps {
  services: ServiceRecord[];
  search: string;
  category: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function ServiceFilters({ services, search, category, onSearchChange, onCategoryChange }: ServiceFiltersProps) {
  const categories = ['All', ...Array.from(new Set(services.map((s) => s.category)))];

  return (
    <div className="mb-8 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search services..."
          className="rounded-2xl border-slate-200 bg-white pl-10 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}

