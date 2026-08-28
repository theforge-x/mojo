export interface TimeRange {
  readonly startIso: string;
  readonly endIso: string;
}

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return new Date(a.startIso) < new Date(b.endIso) && new Date(b.startIso) < new Date(a.endIso);
}

export function durationMinutes(range: TimeRange): number {
  return (new Date(range.endIso).getTime() - new Date(range.startIso).getTime()) / 60_000;
}
