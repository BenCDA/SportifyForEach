import { useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalIcon, ChevronDown, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Drawer } from 'vaul';
import { calendarClassNames, calendarComponents } from './calendar';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useIsMobile';

export type { DateRange };

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
}

function formatRange(range?: DateRange): string {
  if (!range?.from) return '';
  const from = format(range.from, 'd MMM', { locale: fr });
  if (!range.to) return from;
  return `${from} — ${format(range.to, 'd MMM yyyy', { locale: fr })}`;
}

const PRESETS = [
  {
    label: "Aujourd'hui",
    getRange: (): DateRange => { const d = new Date(); return { from: d, to: d }; },
  },
  {
    label: 'Cette semaine',
    getRange: (): DateRange => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    label: 'Ce mois',
    getRange: (): DateRange => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: '30 prochains jours',
    getRange: (): DateRange => ({ from: new Date(), to: addDays(new Date(), 30) }),
  },
];

function RangePanel({
  value,
  onChange,
  onClose,
}: Readonly<{
  value?: DateRange;
  onChange: (r: DateRange | undefined) => void;
  onClose: () => void;
}>) {
  const [internal, setInternal] = useState<DateRange | undefined>(value);

  const handleSelect = (r: DateRange | undefined) => {
    if (r?.from && r?.to && r.from > r.to) {
      setInternal({ from: r.to, to: r.from });
    } else {
      setInternal(r);
    }
  };

  return (
    <div className="bg-surface border border-ink/15 shadow-[0_16px_48px_rgba(26,26,26,0.12)] min-w-[300px]">
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pt-3 pb-2 border-b border-ink/8">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setInternal(p.getRange())}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-ink hover:underline transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <DayPicker
        mode="range"
        locale={fr}
        weekStartsOn={1}
        captionLayout="dropdown"
        fromYear={2024}
        toYear={2032}
        selected={internal}
        onSelect={handleSelect}
        defaultMonth={internal?.from ?? new Date()}
        classNames={calendarClassNames}
        components={calendarComponents}
        className="p-3"
      />
      <div className="flex items-center gap-2 px-4 py-3 border-t border-ink/8">
        {internal?.from && (
          <button
            type="button"
            onClick={() => setInternal(undefined)}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint hover:text-accent transition-colors"
          >
            <X className="w-3 h-3" strokeWidth={1.5} />
            Effacer
          </button>
        )}
        <button
          type="button"
          onClick={() => { onChange(internal); onClose(); }}
          className="ml-auto btn-primary h-8 px-4 text-[10px]"
        >
          Valider
        </button>
      </div>
    </div>
  );
}

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  disabled,
  label,
  className,
  id,
}: Readonly<DateRangePickerProps>) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const triggerEl = (
    <div
      className={cn(
        'flex items-center gap-2 w-full h-12 border-b border-ink/20 bg-transparent cursor-pointer',
        'transition-colors duration-150',
        !disabled && 'hover:border-ink',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <CalIcon className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
      <span className={cn('flex-1 text-left text-sm font-sans', value?.from ? 'text-ink' : 'text-faint')}>
        {formatRange(value) || (placeholder ?? 'Sélectionner une période')}
      </span>
      {value?.from ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
          className="text-faint hover:text-accent transition-colors"
          aria-label="Effacer la période"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
      )}
    </div>
  );

  const panel = (
    <RangePanel value={value} onChange={onChange} onClose={() => setOpen(false)} />
  );

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      {isMobile ? (
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Trigger asChild id={id}>
            <button type="button" disabled={disabled} className="w-full text-left">
              {triggerEl}
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-ink/30 z-50" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto flex flex-col bg-surface">
              <div className="mx-auto mt-3 mb-2 w-10 h-1 bg-ink/20 rounded-full shrink-0" />
              {panel}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild id={id}>
            <button type="button" disabled={disabled} className="w-full text-left">
              {triggerEl}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              sideOffset={4}
              align="start"
              className="z-50 animate-in fade-in-0 zoom-in-[0.97] duration-150"
            >
              {panel}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  );
}
