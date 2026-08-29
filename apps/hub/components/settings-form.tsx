'use client';

import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Checkbox } from '@mojo/shared/ui';
import { useState } from 'react';
import type { SiteHeaderUser } from './site-header';

export function SettingsForm({ user }: { user: SiteHeaderUser }) {
  const [lessonReminders, setLessonReminders] = useState(true);
  const [recapEmails, setRecapEmails] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-headline">Name</span> — {user?.name || '—'}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-headline">Email</span> — {user?.email}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-headline">Role</span> —{' '}
            <span className="capitalize">{user?.role}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Checkbox
            label="Lesson reminders"
            description="A heads-up before each booked lesson."
            checked={lessonReminders}
            onChange={(e) => setLessonReminders(e.target.checked)}
          />
          <Checkbox
            label="Session recap emails"
            description="Your tutor's AI recap after each lesson."
            checked={recapEmails}
            onChange={(e) => setRecapEmails(e.target.checked)}
          />
          <Checkbox
            label="Occasional updates"
            description="New subjects, tutor highlights, learning tips."
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
          />
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {saved && (
          <Alert className="mb-3">
            Preferences saved — nothing leaves this browser in the demo.
          </Alert>
        )}
        <Button onClick={() => setSaved(true)} disabled={saved}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}
