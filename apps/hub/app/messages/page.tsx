import type { ScheduledSession } from '@mojo/scheduling/domain';
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  Empty,
  EmptyDescription,
  EmptyTitle,
} from '@mojo/shared/ui';
import { MessageSquare } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getHub } from '../../demo/composition-root';
import { formatWhen } from '../../lib/format';
import { currentUser } from '../../lib/session';

function threadKey(role: 'tutor' | 'student', session: ScheduledSession): string {
  return role === 'tutor' ? session.studentId : session.tutorId;
}

export default async function MessagesPage() {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'tutor' && user.role !== 'student') redirect('/');
  const role: 'tutor' | 'student' = user.role === 'tutor' ? 'tutor' : 'student';

  const hub = getHub();
  const sessions =
    role === 'tutor'
      ? await hub.scheduling.sessionsByTutor(user.id)
      : await hub.scheduling.sessionsByStudent(user.id);

  const partners = new Map<string, { name: string; sub: string }>();
  for (const session of sessions) {
    const partnerId = threadKey(role, session);
    if (partners.has(partnerId)) continue;
    if (role === 'tutor') {
      const partner = await hub.identity.userById(partnerId);
      partners.set(partnerId, {
        name: partner?.name || partner?.email || 'Student',
        sub: 'Your student',
      });
    } else {
      const profile = await hub.profile.byTutor(partnerId);
      partners.set(partnerId, {
        name: profile?.displayName ?? 'Your tutor',
        sub: (profile?.subjects ?? []).join(', ') || 'Tutor',
      });
    }
  }

  const threads = [...partners.entries()].map(([partnerId, partner]) => {
    const latest = sessions
      .filter((s) => threadKey(role, s) === partnerId)
      .sort((a, b) => a.startIso.localeCompare(b.startIso))
      .at(-1);
    return { partnerId, ...partner, latest };
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-headline">Messages</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Reach your {role === 'tutor' ? 'students' : 'tutors'}. In this demo, conversations happen in
        the lab — your past partners are listed here.
      </p>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Empty>
              <MessageSquare className="size-8 text-muted-foreground" />
              <EmptyTitle>No conversations yet</EmptyTitle>
              <EmptyDescription>
                {role === 'tutor'
                  ? 'Once students book lessons, you can catch up here.'
                  : 'Book a lesson and your tutor will show up here.'}
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {threads.map((thread) => (
            <Card key={thread.partnerId}>
              <CardContent className="flex items-center gap-3 py-4">
                <Avatar
                  name={thread.name}
                  className="border-transparent bg-primary/15 text-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-display text-sm font-bold text-headline">
                      {thread.name}
                    </p>
                    {thread.latest && <Badge variant="muted">{thread.latest.status}</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {thread.sub}
                    {thread.latest && (
                      <> · {formatWhen(thread.latest.startIso, thread.latest.endIso)}</>
                    )}
                  </p>
                </div>
                <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
