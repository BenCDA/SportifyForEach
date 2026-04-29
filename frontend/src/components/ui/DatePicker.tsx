import { useState } from 'react';
import { DayPicker, type Matcher } from 'react-day-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalIcon, ChevronDown, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Drawer } from 'vaul';
import { calendarClassNames, calendarComponents } from './calendar';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useIsMobile';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledDays?: Matcher | Matcher[];
  label?: string;
  className?: string;
  id?: string;
}

function formatDate(date?: Date): string {
  if (!date) return '';
  return format(date, 'eee d MMMM yyyy', { locale: fr });
}

function TriggerButton({
  value,
  placeholder,
  disabled,
}: {
  value?: Date;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
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
        {value ? formatDate(value) : (placeholder ?? 'Sélectionner une date')}
      </span>
      <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.5} />
    </div>
  );
}

function CalendarPanel({
  value,
  onChange,
  onClose,
  disabledDays,
}: {
  value?: Date;
  onChange: (d: Date | undefined) => void;
  onClose: () => void;
  disabledDays?: Matcher | Matcher[];
}) {
  const [internal, setInternal] = useState<Date | undefined>(value);

  return (
    <div className="bg-surface border border-ink/15 shadow-[0_16px_48px_rgba(26,26,26,0.12)] min-w-[280px]">
      <DayPicker
        mode="single"
        locale={fr}
        weekStartsOn={1}
        captionLayout="dropdown"
        fromYear={2024}
        toYear={2032}
        selected={internal}
        onSelect={setInternal}
        disabled={disabledDays}
        defaultMonth={internal ?? new Date()}
        classNames={calendarClassNames}
        components={calendarComponents}
        className="p-3"
      />
      <div className="flex items-center gap-2 px-4 py-3 border-t border-ink/8">
        <button
          type="button"
          onClick={() => setInternal(new Date())}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors"
        >
          Aujourd&apos;hui
        </button>
        {internal && (
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

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  disabledDays,
  label,
  className,
  id,
}: Readonly<DatePickerProps>) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const panel = (
    <CalendarPanel
      value={value}
      onChange={onChange}
      onClose={() => setOpen(false)}
      disabledDays={disabledDays}
    />
  );

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      {isMobile ? (
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Trigger asChild id={id}>
            <button type="button" disabled={disabled} className="w-full text-left">
              <TriggerButton value={value} placeholder={placeholder} disabled={disabled} />
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-ink/30 z-50" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] flex flex-col bg-surface">
              <div className="mx-auto mt-3 mb-2 w-10 h-1 bg-ink/20 rounded-full shrink-0" />
              {panel}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild id={id}>
            <button type="button" disabled={disabled} className="w-full text-left">
              <TriggerButton value={value} placeholder={placeholder} disabled={disabled} />
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
