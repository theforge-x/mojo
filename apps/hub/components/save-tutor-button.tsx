'use client';

import { Button } from '@mojo/shared/ui';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { readSaved, type SavedTutor, subscribe, toggleSaved } from './saved-tutors-store';

export interface SaveTutorButtonProps {
  tutor: SavedTutor;
}

export function SaveTutorButton({ tutor }: SaveTutorButtonProps) {
  const saved = useSyncExternalStore(subscribe, readSaved);
  const isSaved = saved.some((item) => item.tutorId === tutor.tutorId);

  return (
    <Button
      type="button"
      variant={isSaved ? 'secondary' : 'outline'}
      size="sm"
      onClick={() => toggleSaved(tutor)}
    >
      {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {isSaved ? 'Saved' : 'Save tutor'}
    </Button>
  );
}
