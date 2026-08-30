'use client';

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mojo/shared/ui';
import { cn } from '@mojo/shared/util';
import { MinusIcon, PlusIcon } from 'lucide-react';
import type { Weekday } from '../domain/availability.types';

const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const SLOT_MINUTES = 15;
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => i * SLOT_MINUTES);

export interface WeeklyWindow {
  readonly id: string;
  readonly weekday: Weekday;
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface AvailabilityEditorProps {
  rules: readonly WeeklyWindow[];
  onChange: (rules: WeeklyWindow[]) => void;
  onSave?: (rules: WeeklyWindow[]) => Promise<void>;
  saving?: boolean;
  className?: string;
}

/**
 * Controlled weekly availability editor. Windows reference the tutor's own
 * wall-clock (minutes-since-midnight, weekday 0 = Sunday in JS Date terms) —
 * the same units the slot engine stores rules in.
 */
export function AvailabilityEditor({
  rules,
  onChange,
  onSave,
  saving,
  className,
}: AvailabilityEditorProps) {
  const sortRules = (next: WeeklyWindow[]) =>
    [...next].sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);

  const addWindow = () => {
    onChange([
      ...rules,
      {
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `rule-${Date.now()}`,
        weekday: 1,
        startMinute: 540,
        endMinute: 600,
      },
    ]);
  };

  const removeWindow = (id: string) => {
    onChange(sortRules(rules.filter((rule) => rule.id !== id)));
  };

  const patch = (
    id: string,
    patch: Partial<Pick<WeeklyWindow, 'weekday' | 'startMinute' | 'endMinute'>>,
  ) => {
    onChange(
      sortRules(
        rules.map((rule) => {
          if (rule.id !== id) return rule;
          const next = { ...rule, ...patch };
          if (next.endMinute <= next.startMinute) {
            next.endMinute = next.startMinute + SLOT_MINUTES;
          }
          return next;
        }),
      ),
    );
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No windows yet — add when you usually teach so students can book you.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rules.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center gap-2">
              <Select
                value={String(rule.weekday)}
                onValueChange={(value) => patch(rule.id, { weekday: Number(value) as Weekday })}
              >
                <SelectTrigger size="sm" className="w-36" aria-label="Day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {WEEKDAY_LABELS[day]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(rule.startMinute)}
                onValueChange={(value) => patch(rule.id, { startMinute: Number(value) })}
              >
                <SelectTrigger size="sm" className="w-24" aria-label="Start time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((minute) => (
                    <SelectItem key={minute} value={String(minute)}>
                      {formatMinute(minute)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground">–</span>

              <Select
                value={String(rule.endMinute)}
                onValueChange={(value) => patch(rule.id, { endMinute: Number(value) })}
              >
                <SelectTrigger size="sm" className="w-24" aria-label="End time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((minute) => (
                    <SelectItem key={minute} value={String(minute)}>
                      {formatMinute(minute)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove window"
                onClick={() => removeWindow(rule.id)}
              >
                <MinusIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addWindow}>
          <PlusIcon className="size-4" />
          Add a window
        </Button>
        {onSave && (
          <Button type="button" size="sm" onClick={() => onSave([...rules])} disabled={saving}>
            {saving ? 'Saving…' : 'Save availability'}
          </Button>
        )}
      </div>
    </div>
  );
}

function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
