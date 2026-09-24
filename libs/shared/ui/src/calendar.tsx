'use client';
import { cn } from '@mojo/shared/util';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayFlag, DayPicker, SelectionState, UI } from 'react-day-picker';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = false, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        [UI.Months]: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        [UI.Month]: 'space-y-4',
        [UI.MonthCaption]: 'flex justify-center pt-1 relative items-center',
        [UI.CaptionLabel]: 'text-sm font-medium',
        [UI.Nav]: 'absolute inset-x-0 top-0 flex items-center justify-between',
        [UI.PreviousMonthButton]: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md bg-transparent p-0 ml-3 mt-3 opacity-50 transition-opacity hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-25',
        ),
        [UI.NextMonthButton]: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md bg-transparent p-0 mt-2 opacity-50 transition-opacity hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-25',
        ),
        [UI.MonthGrid]: 'w-full border-collapse',
        [UI.Weekdays]: 'text-muted-foreground',
        [UI.Weekday]: 'w-9 p-0 rounded-md font-normal text-[0.8rem]',
        [UI.Weeks]: '',
        [UI.Week]: '',
        [UI.Day]:
          'relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20',
        [UI.DayButton]: cn(
          'h-9 w-9 rounded-md p-0 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/25',
        ),
        [UI.WeekNumber]: 'text-muted-foreground',
        [UI.Dropdown]: 'rounded-md border bg-background text-foreground',
        [UI.DropdownRoot]: 'relative',
        [UI.Dropdowns]: 'flex gap-1',
        [UI.MonthsDropdown]: 'hidden',
        [UI.YearsDropdown]: 'hidden',
        [DayFlag.today]: 'font-semibold',
        [DayFlag.outside]: 'text-muted-foreground/50',
        [DayFlag.disabled]: 'text-muted-foreground/50 cursor-not-allowed',
        [SelectionState.selected]: 'rounded-md bg-primary text-primary-foreground',
        [SelectionState.range_start]: 'rounded-l-md bg-primary text-primary-foreground',
        [SelectionState.range_middle]: 'bg-primary/15 text-foreground',
        [SelectionState.range_end]: 'rounded-r-md bg-primary text-primary-foreground',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className="size-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
