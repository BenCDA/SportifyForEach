import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalIcon, ChevronDown } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Drawer } from 'vaul';
import { calendarClassNames, calendarComponents } from './calendar';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useIsMobile';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disablePast?: boolean;
  label?: string;
  className?: string;
  id?: string;
}

function formatDateTime(date?: Date): string {
  if (!date) return '';
  return format(date, "eee d MMMM · HH'h'mm", { locale: fr });
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function DateTimePanel({
  value,
  onChange,
  onClose,
  disablePast,
}: Readonly<{
  value?: Date;
  onChange: (d: Date | undefined) => void;
  onClose: () => void;
  disablePast?: boolean;
}>) {
  const now = new Date();
  const [date, setDate] = useState<Date | undefined>(value);
  const [hour, setHour] = useState(value ? value.getHours() : now.getHours());
  const [minute, setMinute] = useState(
    value ? (MINUTES.find((m) => m >= value.getMinutes()) ?? 0) : 0,
  );

  const handleValidate = () => {
    if (!date) return;
    onChange(setMinutes(setHours(date, hour), minute));
    onClose();
  };

  return (
    <div className="bg-surface border border-ink/15 shadow-[0_16px_48px_rgba(26,26,26,0.12)] min-w-[280px]">
      <DayPicker
        mode="single"
        locale={fr}
        weekStartsOn={1}
        captionLayout="dropdown"
        fromYear={new Date().getFullYear()}
        toYear={new Date().getFullYear() + 5}
        selected={date}
        onSelect={setDate}
        disabled={disablePast ? { before: now } : undefined}
        defaultMonth={date ?? now}
        classNames={calendarClassNames}
        components={calendarComponents}
        className="p-3"
      />
      <div className="px-4 py-3 border-t border-ink/8">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted mb-2">Heure</p>
        <div className="flex items-center gap-2">
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="flex-1 font-mono text-sm text-ink bg-transparent border-b border-ink/20 h-9 focus:border-ink focus:outline-none transition-colors"
            aria-label="Heure"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}h</option>
            ))}
          </select>
          <span className="font-mono text-sm text-muted">:</span>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="flex-1 font-mono text-sm text-ink bg-transparent border-b border-ink/20 h-9 focus:border-ink focus:outline-none transition-colors"
            aria-label="Minutes"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-ink/8">
        <button
          type="button"
          onClick={() => { setDate(now); setHour(now.getHours()); setMinute(0); }}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors"
        >
          Maintenant
        </button>
        <button
          type="button"
          onClick={handleValidate}
          disabled={!date}
          className="ml-auto btn-primary h-8 px-4 text-[10px] disabled:opacity-40"
        >
          Valider
        </button>
      </div>
    </div>
  );
}

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  disablePast,
  label,
  className,
  id,
}: Readonly<DateTimePickerProps>) {
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
      <span className={cn('flex-1 text-left text-sm font-sans', value ? 'text-ink' : 'text-faint')}>
        {value ? formatDateTime(value) : (placeholder ?? 'Sélectionner date et heure')}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
    </div>
  );

  const panel = (
    <DateTimePanel
      value={value}
      onChange={onChange}
      onClose={() => setOpen(false)}
      disablePast={disablePast}
    />
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
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto bg-surface">
              <div className="mx-auto mt-3 mb-2 w-10 h-1 bg-ink/20 rounded-full" />
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
