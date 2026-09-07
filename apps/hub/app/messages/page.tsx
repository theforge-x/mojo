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
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageChat } from '../../components/message-chat';
import { getHub } from '../../demo/composition-root';
import { currentUser } from '../../lib/session';

type Partner = {
  partnerId: string;
  name: string;
  sub: string;
  unread: number;
  lastAt?: string;
  lastBody?: string;
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'tutor' && user.role !== 'student') redirect('/');
  const role: 'tutor' | 'student' = user.role === 'tutor' ? 'tutor' : 'student';
  const { with: withParam } = await searchParams;

  const hub = getHub();
  const sessions =
    role === 'tutor'
      ? await hub.scheduling.sessionsByTutor(user.id)
      : await hub.scheduling.sessionsByStudent(user.id);

  const partners = new Map<string, Partner>();

  for (const session of sessions) {
    const partnerId = role === 'tutor' ? session.studentId : session.tutorId;
    if (partners.has(partnerId)) continue;
    if (role === 'tutor') {
      const partner = await hub.identity.userById(partnerId);
      partners.set(partnerId, {
        partnerId,
        name: partner?.name || partner?.email || 'Student',
        sub: 'Your student',
        unread: 0,
      });
    } else {
      const profile = await hub.profile.byTutor(partnerId);
      partners.set(partnerId, {
        partnerId,
        name: profile?.displayName ?? 'Your tutor',
        sub: (profile?.subjects ?? []).join(', ') || 'Tutor',
        unread: 0,
      });
    }
  }

  for (const partnerId of await hub.messaging.threadsFor(user.id)) {
    if (partners.has(partnerId)) continue;
    if (role === 'student') {
      const profile = await hub.profile.byTutor(partnerId);
      partners.set(partnerId, {
        partnerId,
        name: profile?.displayName ?? partnerId,
        sub: (profile?.subjects ?? []).join(', ') || 'Tutor',
        unread: 0,
      });
    } else {
      const partner = await hub.identity.userById(partnerId);
      partners.set(partnerId, {
        partnerId,
        name: partner?.name || partner?.email || partnerId,
        sub: 'Your student',
        unread: 0,
      });
    }
  }

  for (const partner of partners.values()) {
    const thread = await hub.messaging.threadBetween(user.id, partner.partnerId);
    const last = thread.at(-1);
    if (last) {
      partner.lastAt = last.sentAt;
      partner.lastBody = last.body;
    }
    partner.unread = thread.filter((m) => m.recipientId === user.id && m.readAt === null).length;
  }

  const threads = [...partners.values()].sort((a, b) =>
    (b.lastAt ?? '0').localeCompare(a.lastAt ?? '0'),
  );

  const activeId =
    withParam && threads.some((t) => t.partnerId === withParam)
      ? withParam
      : (threads[0]?.partnerId ?? '');
  const active = threads.find((t) => t.partnerId === activeId);
  const activeThread = active ? await hub.messaging.threadBetween(user.id, active.partnerId) : [];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-headline">Messages</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Chat with {role === 'tutor' ? 'students' : 'tutors'} before you book — no session needed.
      </p>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Empty>
              <MessageSquare className="size-8 text-muted-foreground" />
              <EmptyTitle>No conversations yet</EmptyTitle>
              <EmptyDescription>
                {role === 'tutor'
                  ? 'When a student reaches out or books with you, their thread shows up here.'
                  : 'Find a tutor and say hello before booking.'}
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-2">
            {threads.map((thread) => (
              <Link
                key={thread.partnerId}
                href={`/messages?with=${encodeURIComponent(thread.partnerId)}`}
                className={`rounded-xl border p-3 transition-colors hover:bg-muted ${
                  thread.partnerId === activeId ? 'border-primary/60 bg-muted/60' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={thread.name}
                    className="border-transparent bg-primary/15 text-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-display text-sm font-bold text-headline">
                        {thread.name}
                      </p>
                      {thread.unread > 0 && (
                        <Badge
                          variant="primary"
                          className="size-5 justify-center rounded-full p-0 text-xs"
                        >
                          {thread.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {thread.unread > 0 && thread.lastBody ? thread.lastBody : thread.sub}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Card className="min-h-[420px] overflow-hidden">
            {active ? (
              <MessageChat
                key={active.partnerId}
                meId={user.id}
                partnerId={active.partnerId}
                partnerName={active.name}
                initial={activeThread}
              />
            ) : (
              <CardContent className="py-12">
                <Empty>
                  <EmptyTitle>Pick a conversation</EmptyTitle>
                  <EmptyDescription>
                    Choose a thread on the left to start chatting.
                  </EmptyDescription>
                </Empty>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </main>
  );
}
