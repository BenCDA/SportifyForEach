import React from 'react';
import type { ClassNames, CustomComponents, ChevronProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

function ChevronIcon({ orientation }: ChevronProps): React.JSX.Element {
  return orientation === 'left'
    ? <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
    : <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />;
}

export const calendarClassNames: Partial<ClassNames> = {
  root: 'w-full',
  months: 'flex flex-col gap-4',
  month: 'flex flex-col gap-3',
  month_caption: 'flex items-center justify-between px-1 pb-1',
  caption_label: 'font-serif italic text-[19px] text-ink leading-none',
  dropdowns: 'flex items-center gap-1.5',
  dropdown: cn(
    'font-serif italic text-[17px] text-ink bg-transparent border-0 cursor-pointer',
    'outline-none focus-visible:underline',
  ),
  dropdown_root: 'relative',
  nav: 'flex items-center gap-1',
  button_previous: cn(
    'w-7 h-7 flex items-center justify-center text-muted hover:text-ink',
    'transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
    'focus-visible:outline-2 focus-visible:outline-ink',
  ),
  button_next: cn(
    'w-7 h-7 flex items-center justify-center text-muted hover:text-ink',
    'transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
    'focus-visible:outline-2 focus-visible:outline-ink',
  ),
  month_grid: 'w-full border-collapse',
  weekdays: 'flex mb-1',
  weekday:
    'flex-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint text-center pb-1',
  week: 'flex',
  day: 'flex-1 p-0',
  day_button: cn(
    'w-full aspect-square flex items-center justify-center',
    'font-sans text-[13px] text-ink',
    'hover:bg-ink/5 transition-colors duration-100',
    'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-0',
    'disabled:text-faint disabled:cursor-not-allowed disabled:hover:bg-transparent',
    'rounded-none',
  ),
  today: 'border border-ink font-medium',
  selected: 'bg-ink text-paper hover:bg-ink hover:text-paper',
  range_start: 'bg-ink text-paper rounded-none',
  range_end: 'bg-ink text-paper rounded-none',
  range_middle: 'bg-ink/10 text-ink rounded-none',
  outside: 'text-faint opacity-40',
  hidden: 'invisible',
  disabled: 'text-faint opacity-30 cursor-not-allowed',
};

export const calendarComponents: Partial<CustomComponents> = {
  Chevron: ChevronIcon,
};
