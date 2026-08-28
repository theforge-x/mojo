'use client';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, UI } from "react-day-picker";
import { cn } from '@mojo/shared/util';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        [UI.Root]: "rdp",
        [UI.Months]: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        [UI.Month]: "space-y-4",
        [UI.MonthCaption]: "flex justify-center pt-1 relative items-center",
        [UI.CaptionLabel]: "text-sm font-medium",
        [UI.Nav]: "space-x-1 flex items-center",
        [UI.PreviousMonthButton]: cn(
          "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        [UI.NextMonthButton]: cn(
          "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        [UI.MonthGrid]: "w-full border-collapse space-y-1",
        [UI.Weekdays]: "flex",
        [UI.Weekday]: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        [UI.Weeks]: "",
        [UI.Week]: "flex w-full mt-2",
        [UI.Day]: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].rdp-range_end)]:rounded-r-md [&:has([aria-selected].rdp-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        [UI.DayButton]: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        [UI.WeekNumber]: "text-muted-foreground",
        [UI.Dropdown]: "rounded-md border bg-background text-foreground",
        [UI.DropdownRoot]: "relative",
        [UI.Dropdowns]: "flex gap-1",
        [UI.MonthsDropdown]: "hidden",
        [UI.YearsDropdown]: "hidden",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
