import { Badge } from '@mojo/shared/ui';

const VARIANT: Record<string, 'primary' | 'muted' | 'tertiary'> = {
  confirmed: 'primary',
  completed: 'muted',
  booked: 'tertiary',
  cancelled: 'muted',
  no_show: 'muted',
};

export function SessionStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT[status] ?? 'tertiary'}>{status.replace('_', ' ')}</Badge>;
}
