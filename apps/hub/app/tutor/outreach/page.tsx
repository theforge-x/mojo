import { Avatar, Badge, Button, Card, CardContent, Empty, EmptyTitle } from '@mojo/shared/ui';
import { Handshake, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHub } from '../../../demo/composition-root';
import { currentUser } from '../../../lib/session';

function relativeTime(iso: string): string {
  const diffSeconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSeconds < 60) return 'just now';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function TutorOutreachPage() {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'tutor') redirect('/');

  const hub = getHub();
  const [interests, sessions] = await Promise.all([
    hub.interests.forTutor(user.id),
    hub.scheduling.sessionsByTutor(user.id),
  ]);

  const sessionStudents = new Set(sessions.map((s) => s.studentId));
  const rows = await Promise.all(
    interests.map(async (interest) => {
      const student = interest.studentId ? await hub.identity.userById(interest.studentId) : null;
      return {
        interest,
        name: student?.name || student?.email || interest.studentId,
        alreadyBooked: sessionStudents.has(interest.studentId),
      };
    }),
  );

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <Handshake className="size-6 text-primary" />
        <h1 className="font-display text-2xl font-bold text-headline">Tutor outreach</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Students who searched for or viewed your profile. Reach out to them before they pick another
        tutor.
      </p>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyTitle>No interested students yet</EmptyTitle>
              <p className="text-sm text-muted-foreground">
                When a student searches for or views your profile, they will show up here.
              </p>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ interest, name, alreadyBooked }) => (
            <Card key={`${interest.studentId}:${interest.tutorId}`}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={name} className="border-transparent bg-primary/15 text-primary" />
                  <div>
                    <div className="font-display text-sm font-bold text-headline">{name}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={interest.source === 'view' ? 'primary' : 'muted'}>
                        {interest.source === 'view' ? 'Viewed your profile' : 'Searched for you'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(interest.createdAt)}
                      </span>
                      {alreadyBooked && (
                        <Badge variant="outline" className="text-xs">
                          Already a student
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Link href={`/messages?with=${encodeURIComponent(interest.studentId)}`}>
                  <Button size="sm">
                    <MessageSquare className="size-4" />
                    Message
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
