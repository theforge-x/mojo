'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@mojo/shared/ui';
import { CalendarPlus } from 'lucide-react';

function toBasicDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Totally client-side calendar sync: downloads an .ics file or opens a
 * prefilled Google Calendar event. No backend, no OAuth — the slot times
 * are already on the card.
 */
export function CalendarExportButton({
  sessionId,
  title,
  description,
  startIso,
  endIso,
}: {
  sessionId: string;
  title: string;
  description?: string;
  startIso: string;
  endIso: string;
}) {
  function downloadIcs() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//mojo//lessons//EN',
      'BEGIN:VEVENT',
      `UID:${sessionId}@mojo.tutoring`,
      `DTSTAMP:${toBasicDate(new Date().toISOString())}`,
      `DTSTART:${toBasicDate(startIso)}`,
      `DTEND:${toBasicDate(endIso)}`,
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(description ?? `Mojo lesson ${sessionId}`)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mojo-lesson-${sessionId}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const googleUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${toBasicDate(startIso)}/${toBasicDate(endIso)}` +
    `&details=${encodeURIComponent(description ?? `Mojo lesson ${sessionId}`)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" aria-label="Add lesson to calendar">
          <CalendarPlus className="size-4" aria-hidden />
          Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={downloadIcs}>Download .ics file</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
