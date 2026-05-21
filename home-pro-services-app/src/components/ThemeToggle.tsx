import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options: { value: typeof theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const current = options.find((o) => o.value === theme);
  const Icon = current?.icon ?? Sun;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle theme"
      >
        <Icon className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTheme(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                theme === opt.value
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

