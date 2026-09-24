import { Badge } from '@mojo/shared/ui';

const VARIANT: Record<string, 'muted' | 'primary' | 'tertiary'> = {
  entry: 'muted',
  established: 'primary',
  expert: 'tertiary',
};

export function LevelBadge({ level }: { level: string }) {
  return <Badge variant={VARIANT[level] ?? 'muted'}>{level}</Badge>;
}
