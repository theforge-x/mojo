import { Badge } from '@mojo/shared/ui';
import { Users } from 'lucide-react';

/** Marks a session row as a group-lab seat with its live seat count. */
export function GroupLabBadge({ seats }: { seats: number }) {
  return (
    <Badge variant="secondary" className="gap-1">
      <Users className="size-3" aria-hidden />
      Group · {seats}
    </Badge>
  );
}
