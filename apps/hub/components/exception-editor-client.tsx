'use client';

import type { AvailabilityException } from '@mojo/scheduling/domain';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mojo/shared/ui';
import { useCallback, useEffect, useState } from 'react';

interface ExceptionEditorClientProps {
  initialExceptions: AvailabilityException[];
  todayKey: string;
}

const WEEK = 14;

type ExceptionDraft = Omit<AvailabilityException, 'id' | 'tutorId' | 'date'>;

export function ExceptionEditorClient({ initialExceptions, todayKey }: ExceptionEditorClientProps) {
  const [exceptions, setExceptions] = useState<AvailabilityException[]>(initialExceptions);
  const [date, setDate] = useState(todayKey);
  const [kind, setKind] = useState<'blocked' | 'extra'>('blocked');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [saving, setSaving] = useState(false);

  const toKey = addDays(todayKey, WEEK);

  const reload = useCallback(async () => {
    const response = await fetch(`/api/availability/exceptions?from=${todayKey}&to=${toKey}`);
    if (!response.ok) return;
    const body = (await response.json()) as { exceptions: AvailabilityException[] };
    setExceptions(body.exceptions);
  }, [todayKey, toKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = async (daySet: ExceptionDraft[]) => {
    setSaving(true);
    try {
      const response = await fetch('/api/availability/exceptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, exceptions: daySet }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Could not save exceptions.');
      }
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const startMinute = timeToMinutes(startTime);
  const endMinute = timeToMinutes(endTime);

  const add = () => {
    const daySet = exceptions
      .filter((e) => e.date === date)
      .map((e) => ({ kind: e.kind, startMinute: e.startMinute, endMinute: e.endMinute }));
    daySet.push({ kind, startMinute, endMinute });
    void save(daySet);
  };

  const remove = (id: string) => {
    const daySet = exceptions
      .filter((e) => e.date === date && e.id !== id)
      .map((e) => ({ kind: e.kind, startMinute: e.startMinute, endMinute: e.endMinute }));
    void save(daySet);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date exceptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Field className="flex-col">
            <FieldLabel htmlFor="exception-date">Date</FieldLabel>
            <Input
              id="exception-date"
              type="date"
              min={todayKey}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field className="flex-col">
            <FieldLabel htmlFor="exception-start">Start</FieldLabel>
            <Input
              id="exception-start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </Field>
          <Field className="flex-col">
            <FieldLabel htmlFor="exception-end">End</FieldLabel>
            <Input
              id="exception-end"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </Field>
          <Field className="flex-col">
            <FieldLabel>Kind</FieldLabel>
            <Select value={kind} onValueChange={(value) => setKind(value as 'blocked' | 'extra')}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="extra">Extra</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Button
            onClick={add}
            disabled={saving || endMinute <= startMinute}
            size="sm"
            variant="secondary"
          >
            Add exception
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No exceptions in the next {WEEK} days. A blocked exception hides its window; an extra
            exception opens a window outside the weekly rules.
          </p>
        ) : (
          <ul className="space-y-2">
            {exceptions.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-headline">{e.date}</span>{' '}
                  <span
                    className={
                      e.kind === 'blocked' ? 'text-destructive' : 'text-calendar-availability'
                    }
                  >
                    {minutesToLabel(e.startMinute)}–{minutesToLabel(e.endMinute)} · {e.kind}
                  </span>
                </span>
                <Button variant="outline" size="sm" onClick={() => remove(e.id)} disabled={saving}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function addDays(key: string, offset: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function timeToMinutes(value: string): number {
  const [rawHour, rawMinute] = value.split(':').map(Number);
  const hour = Number.isFinite(rawHour) ? (rawHour as number) : 0;
  const minute = Number.isFinite(rawMinute) ? (rawMinute as number) : 0;
  return hour * 60 + minute;
}

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
