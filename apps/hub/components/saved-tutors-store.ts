'use client';

export interface SavedTutor {
  tutorId: string;
  displayName: string;
  subjects: readonly string[];
  perSegmentMinor: number;
  level: string;
}

const STORAGE_KEY = 'mojo.savedTutors';
const UPDATED_EVENT = 'saved-tutors-updated';

export function readSaved(): SavedTutor[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedTutor[]) : [];
  } catch {
    return [];
  }
}

export function writeSaved(list: SavedTutor[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

export function toggleSaved(tutor: SavedTutor): void {
  const saved = readSaved();
  if (saved.some((item) => item.tutorId === tutor.tutorId)) {
    writeSaved(saved.filter((item) => item.tutorId !== tutor.tutorId));
  } else {
    writeSaved([...saved, tutor]);
  }
}

export function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(UPDATED_EVENT, callback);
  };
}
