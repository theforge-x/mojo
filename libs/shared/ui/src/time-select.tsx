'use client';

import { cn } from '@mojo/shared/util';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const SLOT_MINUTES = 15;
const TIME_OPTIONS = Array.from(
  { length: (24 * 60) / SLOT_MINUTES },
  (_, index) => index * SLOT_MINUTES,
);

export interface TimeSelectProps {
  /** Minutes since midnight. */
  value?: number;
  onValueChange?: (minutes: number) => void;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/** Shadcn-style time picker: a Select of 15-minute slots, values in minutes-since-midnight. */
export function TimeSelect({
  value,
  onValueChange,
  id,
  ariaLabel,
  disabled,
  className,
}: TimeSelectProps) {
  return (
    <Select
      value={value === undefined ? undefined : String(value)}
      onValueChange={(next) => onValueChange?.(Number(next))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn('w-24', className)} aria-label={ariaLabel ?? 'Time'}>
        <SelectValue placeholder="Time" />
      </SelectTrigger>
      <SelectContent>
        {TIME_OPTIONS.map((minute) => (
          <SelectItem key={minute} value={String(minute)}>
            {formatMinutes(minute)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
