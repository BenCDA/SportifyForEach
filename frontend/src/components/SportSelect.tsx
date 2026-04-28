import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { cn } from '../lib/utils';

const ALL_SPORTS = [
  'Arts martiaux', 'Basketball', 'Boxe', 'Course à pied', 'Cross-training',
  'Crossfit', 'Cyclisme', 'Danse', 'Escalade', 'Fitness', 'Football', 'Golf',
  'HIIT', 'Méditation', 'MMA', 'Musculation', 'Natation', 'Pilates',
  'Préparation physique', 'Rééducation', 'Rugby', 'Self-défense', 'Ski',
  'Stretching', 'Surf', 'Tennis', 'Volleyball', 'Yoga',
];

interface SportSelectProps {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  maxSelections?: number;
}

export function SportSelect({ value, onChange, error, maxSelections = 3 }: Readonly<SportSelectProps>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = ALL_SPORTS.filter(
    (s) => s.toLowerCase().includes(search.toLowerCase()) && !value.includes(s),
  );

  const toggle = (sport: string) => {
    if (value.includes(sport)) onChange(value.filter((s) => s !== sport));
    else if (value.length < maxSelections) onChange([...value, sport]);
  };

  return (
    <div ref={ref} className="relative">
      {/* Selected chips — rendered above the trigger, chips have their own remove buttons */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((sport) => (
            <span
              key={sport}
              className="inline-flex items-center gap-1 bg-ink text-paper font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5"
            >
              {sport}
              <button
                type="button"
                onClick={() => toggle(sport)}
                className="hover:opacity-60 transition-opacity focus:outline-none"
                aria-label={`Retirer ${sport}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger button — standalone, no nested interactives */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between pb-2',
          'border-0 border-b-2 border-ink/15 bg-transparent',
          'focus:outline-none focus:border-ink transition-colors duration-200',
          open && 'border-ink',
          error && 'border-accent',
        )}
      >
        {(() => {
          const plural = value.length > 1 ? 's' : '';
          const triggerLabel =
            value.length === 0
              ? `Sélectionner (max ${maxSelections})`
              : `${value.length} sélectionné${plural} — modifier`;
          return <span className="font-sans text-sm text-faint">{triggerLabel}</span>;
        })()}
        <ChevronDown
          className={cn('w-4 h-4 text-muted transition-transform duration-150', open && 'rotate-180')}
          strokeWidth={1.5}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-ink/12 shadow-[0_8px_24px_rgba(26,26,26,0.08)]">
          <div className="px-3 py-2 border-b border-ink/8 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-faint shrink-0" strokeWidth={1.5} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent font-sans text-sm text-ink placeholder-faint focus:outline-none"
              placeholder="Rechercher..."
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {value.length >= maxSelections && (
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent text-center py-2 px-3 border-b border-ink/8">
                Maximum {maxSelections} atteint
              </p>
            )}
            {filtered.length === 0 ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint text-center py-4">
                Aucun résultat
              </p>
            ) : (
              filtered.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => { toggle(sport); setSearch(''); }}
                  disabled={value.length >= maxSelections}
                  className="w-full text-left px-4 py-2.5 font-sans text-sm text-ink hover:bg-ink/[0.04] transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sport}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
