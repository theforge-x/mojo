'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  Empty,
  EmptyDescription,
  EmptyTitle,
} from '@mojo/shared/ui';
import { Bookmark, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { formatMinor } from '../lib/format';
import { readSaved, subscribe, writeSaved } from './saved-tutors-store';

export function SavedTutorsList() {
  const saved = useSyncExternalStore(subscribe, readSaved);

  if (saved.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Empty>
            <Bookmark className="size-8 text-muted-foreground" />
            <EmptyTitle>No saved tutors yet</EmptyTitle>
            <EmptyDescription>
              Tap the bookmark on any tutor&apos;s page and they&apos;ll show up here for quick
              booking.
            </EmptyDescription>
          </Empty>
        </CardContent>
        <div className="pb-6 text-center">
          <Link href="/tutors">
            <Button>Find a tutor</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map((tutor) => (
        <Card key={tutor.tutorId}>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-headline">
                {tutor.displayName}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {[...tutor.subjects].join(', ')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatMinor(tutor.perSegmentMinor)}/segment ·{' '}
                <Badge variant="muted">{tutor.level}</Badge>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/tutors/${tutor.tutorId}`}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Remove ${tutor.displayName}`}
                onClick={() => writeSaved(saved.filter((item) => item.tutorId !== tutor.tutorId))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
