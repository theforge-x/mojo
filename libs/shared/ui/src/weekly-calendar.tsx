'use client';
import { cn } from '@mojo/shared/util';
import { useCallback, useMemo, useRef, useState } from 'react';

export type CalendarEventKind = 'availability' | 'booking' | 'blocked';

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  start: string; // ISO
  end: string; // ISO
  participants?: string[];
  color?: 'green' | 'blue' | 'gray' | 'red';
}

export interface WeeklyCalendarProps {
  /** Events to render on the calendar. */
  events: CalendarEvent[];
  /** Week start date (Monday). */
  weekStart: Date;
  /** Called when user drags to create a new availability slot. */
  onCreateSlot?: (start: Date, end: Date) => void;
  /** Called when user clicks an existing event. */
  onEventClick?: (event: CalendarEvent) => void;
  /** Whether drag-to-create is enabled. */
  dragEnabled?: boolean;
  /** 0-23, the first hour to show (default: 7). */
  startHour?: number;
  /** 0-23, the last hour to show (default: 22). */
  endHour?: number;
  /** Whether the calendar is in read-only mode (no interactions). */
  readOnly?: boolean;
  className?: string;
}

const SLOT_HEIGHT_PX = 12; // each 15-min slot
const HOUR_SLOTS = 4;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function _startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayIndexForEvent(eventStart: string, weekStart: Date): number {
  const d = new Date(eventStart);
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    if (sameDay(d, day)) return i;
  }
  return -1;
}

function colorClasses(color?: string): string {
  switch (color) {
    case 'green':
      return 'bg-calendar-availability/20 border-calendar-availability/40 text-calendar-availability-foreground';
    case 'blue':
      return 'bg-calendar-booking/20 border-calendar-booking/40 text-calendar-booking-foreground';
    case 'red':
      return 'bg-calendar-blocked/20 border-calendar-blocked/40 text-calendar-blocked-foreground';
    case 'gray':
      return 'bg-muted/60 border-border text-muted-foreground';
    default:
      return 'bg-muted/40 border-border text-muted-foreground';
  }
}

export function WeeklyCalendar({
  events,
  weekStart,
  onCreateSlot,
  onEventClick,
  dragEnabled = false,
  startHour = 7,
  endHour = 22,
  readOnly = false,
  className,
}: WeeklyCalendarProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    day: number;
    startSlot: number;
    endSlot: number;
  } | null>(null);

  const hours = useMemo(
    () => HOURS.filter((h) => h >= startHour && h <= endHour),
    [startHour, endHour],
  );
  const totalSlots = hours.length * HOUR_SLOTS;

  // Compute day dates for the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const slotFromY = useCallback(
    (y: number): number => {
      if (!gridRef.current) return 0;
      const rect = gridRef.current.getBoundingClientRect();
      const relY = y - rect.top;
      const slotHeight = SLOT_HEIGHT_PX;
      return Math.max(0, Math.min(totalSlots - 1, Math.floor(relY / slotHeight)));
    },
    [totalSlots],
  );

  const dayFromX = useCallback((x: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const relX = x - rect.left;
    // Label column is ~48px, then 7 equal day columns
    const labelWidth = 48;
    const dayWidth = (rect.width - labelWidth) / 7;
    return Math.max(0, Math.min(6, Math.floor((relX - labelWidth) / dayWidth)));
  }, []);

  const slotToDate = useCallback(
    (day: number, slot: number): Date => {
      const base = weekDays[day];
      if (!base) return new Date(NaN);
      const d = new Date(base.getTime());
      const hour = startHour + Math.floor(slot / HOUR_SLOTS);
      const min = (slot % HOUR_SLOTS) * 15;
      d.setHours(hour, min, 0, 0);
      return d;
    },
    [weekDays, startHour],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!dragEnabled || readOnly) return;
      e.preventDefault();
      const day = dayFromX(e.clientX);
      const slot = slotFromY(e.clientY);
      setDragging({ day, startSlot: slot, endSlot: slot });
    },
    [dragEnabled, readOnly, dayFromX, slotFromY],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const day = dayFromX(e.clientX);
      const slot = slotFromY(e.clientY);
      if (day === dragging.day) {
        setDragging((prev) => (prev ? { ...prev, endSlot: slot } : null));
      }
    },
    [dragging, dayFromX, slotFromY],
  );

  const handleMouseUp = useCallback(() => {
    if (!dragging || !onCreateSlot) {
      setDragging(null);
      return;
    }
    const minSlot = Math.min(dragging.startSlot, dragging.endSlot);
    const maxSlot = Math.max(dragging.startSlot, dragging.endSlot) + 1; // inclusive
    const start = slotToDate(dragging.day, minSlot);
    const end = slotToDate(dragging.day, maxSlot);
    if (end.getTime() > start.getTime()) {
      onCreateSlot(start, end);
    }
    setDragging(null);
  }, [dragging, onCreateSlot, slotToDate]);

  return (
    <div className={cn('flex flex-col select-none', className)}>
      {/* Day headers */}
      <div className="flex border-b border-border">
        <div className="w-12 shrink-0" />
        {weekDays.map((day, i) => (
          <div
            key={day.toISOString()}
            className="flex-1 px-1 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            <div>{WEEKDAY_LABELS[i]}</div>
            <div className="text-[10px] text-muted-foreground/60">
              {day.getDate()}/{day.getMonth() + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-to-create grid is a mouse-only canvas, events are keyboard-accessible */}
      <div
        ref={gridRef}
        className="relative flex overflow-y-auto"
        style={{ maxHeight: `${totalSlots * SLOT_HEIGHT_PX + 1}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragging(null)}
      >
        {/* Hour labels */}
        <div className="w-12 shrink-0">
          {hours.map((h) => (
            <div
              key={h}
              className="relative"
              style={{ height: `${HOUR_SLOTS * SLOT_HEIGHT_PX}px` }}
            >
              <span className="absolute -top-2 right-1 text-[10px] text-muted-foreground/60">
                {formatHour(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1">
          {weekDays.map((day, dayIdx) => (
            <div key={day.toISOString()} className="relative flex-1 border-l border-border">
              {/* Hour grid lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-b border-border/50"
                  style={{ height: `${HOUR_SLOTS * SLOT_HEIGHT_PX}px` }}
                />
              ))}

              {/* Events */}
              {events
                .filter((ev) => dayIndexForEvent(ev.start, weekStart) === dayIdx)
                .map((ev) => {
                  const evStart = new Date(ev.start);
                  const evEnd = new Date(ev.end);
                  const startMinutes = evStart.getHours() * 60 + evStart.getMinutes();
                  const endMinutes = evEnd.getHours() * 60 + evEnd.getMinutes();
                  const topOffset = ((startMinutes - startHour * 60) / 15) * SLOT_HEIGHT_PX;
                  const height = ((endMinutes - startMinutes) / 15) * SLOT_HEIGHT_PX;
                  if (topOffset + height < 0 || topOffset > totalSlots * SLOT_HEIGHT_PX)
                    return null;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      className={cn(
                        'absolute left-0.5 right-0.5 rounded border px-1 py-0.5 text-left text-[10px] leading-tight overflow-hidden cursor-pointer transition-opacity hover:opacity-80',
                        colorClasses(ev.color),
                      )}
                      style={{ top: `${topOffset}px`, height: `${Math.max(height, 12)}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(ev);
                      }}
                    >
                      <div className="truncate font-medium">{ev.title}</div>
                      {height >= 28 && (
                        <div className="truncate opacity-70">
                          {formatTimeShort(ev.start)} – {formatTimeShort(ev.end)}
                        </div>
                      )}
                      {height >= 44 && ev.participants && ev.participants.length > 0 && (
                        <div className="truncate opacity-60">
                          {ev.participants.length} participant(s)
                        </div>
                      )}
                    </button>
                  );
                })}

              {/* Drag preview */}
              {dragging && dragging.day === dayIdx && (
                <div
                  className="absolute left-0.5 right-0.5 rounded border border-dashed border-primary/50 bg-primary/10 pointer-events-none"
                  style={{
                    top: `${Math.min(dragging.startSlot, dragging.endSlot) * SLOT_HEIGHT_PX}px`,
                    height: `${(Math.abs(dragging.endSlot - dragging.startSlot) + 1) * SLOT_HEIGHT_PX}px`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
