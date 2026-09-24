'use client';
import { cn } from '@mojo/shared/util';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DatePickerProps {
  id?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  fromDate?: Date;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  fromDate,
  disabled,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-9 justify-start gap-2 overflow-hidden rounded-md border border-border bg-background px-3 text-left text-sm font-normal text-foreground shadow-xs hover:bg-background active:scale-100',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-0',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {value ? (
            <span className="min-w-0 flex-1 truncate">{format(value, 'PPP')}</span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={fromDate ? { before: fromDate } : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  disabled,
  className,
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-9 justify-start gap-2 overflow-hidden rounded-md border border-border bg-background px-3 text-left text-sm font-normal text-foreground shadow-xs hover:bg-background active:scale-100',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-0',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {value?.from ? (
            value.to ? (
              <span className="min-w-0 flex-1 truncate">
                {format(value.from, 'LLL dd, y')} – {format(value.to, 'LLL dd, y')}
              </span>
            ) : (
              <span className="min-w-0 flex-1 truncate">{format(value.from, 'LLL dd, y')}</span>
            )
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" selected={value} onSelect={onChange} numberOfMonths={2} />
      </PopoverContent>
    </Popover>
  );
}
