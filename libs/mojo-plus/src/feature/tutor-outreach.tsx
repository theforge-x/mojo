import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyTitle,
} from '@mojo/shared/ui';
import { Crown, Handshake, Lock, MessageSquare } from 'lucide-react';
import Link from 'next/link';

/** One interested student, with its display name already resolved by the app. */
export interface TutorOutreachLead {
  readonly studentId: string;
  readonly displayName: string;
  readonly source: 'search' | 'view';
  readonly createdAt: string;
  readonly alreadyBooked: boolean;
}

function relativeTime(iso: string): string {
  const diffSeconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diffSeconds < 60) return 'just now';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function LeadCard({ lead }: { lead: TutorOutreachLead }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={lead.displayName}
            className="border-transparent bg-primary/15 text-primary"
          />
          <div>
            <div className="font-display text-sm font-bold text-headline">{lead.displayName}</div>
            <div className="flex items-center gap-2">
              <Badge variant={lead.source === 'view' ? 'primary' : 'muted'}>
                {lead.source === 'view' ? 'Viewed your profile' : 'Searched for you'}
              </Badge>
              <span className="text-xs text-muted-foreground">{relativeTime(lead.createdAt)}</span>
              {lead.alreadyBooked && (
                <Badge variant="outline" className="text-xs">
                  Already a student
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Link href={`/messages?with=${encodeURIComponent(lead.studentId)}`}>
          <Button size="sm">
            <MessageSquare className="size-4" />
            Message
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function LockedOutreach({ leadCount }: { leadCount: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-primary/15">
          <Crown className="size-6 text-primary" aria-hidden />
        </span>
        <div className="font-display text-lg font-bold text-headline">
          Outreach is a Mojo+ benefit
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          {leadCount === 0
            ? 'When a student searches for or views your profile, they will show up here — visible only to Mojo+ tutors.'
            : `${leadCount} interested student${leadCount === 1 ? '' : 's'} ${leadCount === 1 ? 'is' : 'are'} waiting. Activate Mojo+ to see who they are and message them before they pick another tutor.`}
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <li>
            <Badge variant="primary">Custom lesson rate</Badge>
          </li>
          <li>
            <Badge variant="primary">+10% take-home</Badge>
          </li>
          <li>
            <Badge variant="primary">Outreach leads</Badge>
          </li>
        </ul>
        <Link href="/tutor">
          <Button size="sm">
            <Crown className="size-4" />
            Unlock with Mojo+
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Tutor outreach as a Mojo+ benefit. Subscribers see every interested
 * student with a message CTA; everyone else sees the locked upsell (lead
 * count only — no names leak).
 */
export function TutorOutreach({
  hasAccess,
  leads,
  totalCount,
}: {
  hasAccess: boolean;
  leads: readonly TutorOutreachLead[];
  totalCount: number;
}) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <Handshake className="size-6 text-primary" />
        <h1 className="font-display text-2xl font-bold text-headline">Tutor outreach</h1>
        {!hasAccess && (
          <Badge variant="primary" className="gap-1">
            <Crown className="size-3" aria-hidden />
            Mojo+
          </Badge>
        )}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Students who searched for or viewed your profile. Reach out to them before they pick another
        tutor.
      </p>

      {!hasAccess ? (
        <LockedOutreach leadCount={totalCount} />
      ) : leads.length === 0 ? (
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
          {leads.map((lead) => (
            <LeadCard key={`${lead.studentId}`} lead={lead} />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Dashboard teaser for the tutor home grid. The lead count stays visible so
 * tutors know what they are missing; names and the message CTA stay behind
 * the Mojo+ gate on the outreach page.
 */
export function TutorOutreachCard({
  leadCount,
  hasAccess,
}: {
  leadCount: number;
  hasAccess: boolean;
}) {
  return (
    <Card className="h-full transition-opacity hover:opacity-90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasAccess ? (
            <Handshake className="size-4 text-primary" />
          ) : (
            <Lock className="size-4 text-primary" />
          )}
          Outreach
          {!hasAccess && (
            <Badge variant="primary" className="gap-1">
              <Crown className="size-3" aria-hidden />
              Mojo+
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <span className="font-display text-3xl font-extrabold text-headline">{leadCount}</span>
        {!hasAccess && (
          <p className="mt-1 text-xs text-muted-foreground">Mojo+ tutors see who’s interested.</p>
        )}
      </CardContent>
    </Card>
  );
}
