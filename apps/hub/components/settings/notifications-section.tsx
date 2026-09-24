'use client';

import type { NotificationPreferences } from '@mojo/notifications/domain';
import { Alert, Button, Checkbox, FieldLegend, FieldSet } from '@mojo/shared/ui';
import { useEffect, useState } from 'react';

interface PreferencesResponse {
  ok: boolean;
  preferences: NotificationPreferences;
}

export function NotificationsSection() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    lessonReminders: true,
    recapEmails: true,
    marketing: false,
    channels: ['email'],
  });
  const [emailChannel, setEmailChannel] = useState(true);
  const [whatsappChannel, setWhatsappChannel] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderInfo, setReminderInfo] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) return;
      const body = (await response.json()) as PreferencesResponse;
      setPreferences(body.preferences);
      setEmailChannel(body.preferences.channels.includes('email'));
      setWhatsappChannel(body.preferences.channels.includes('whatsapp'));
    })();
  }, []);

  const save = async (next: NotificationPreferences) => {
    setSaved(false);
    setError(null);
    const response = await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      setError('Could not save preferences.');
      return;
    }
    const body = (await response.json()) as PreferencesResponse;
    setPreferences(body.preferences);
    setSaved(true);
  };

  const toggleChannel = (channel: 'email' | 'whatsapp', enabled: boolean) => {
    const nextChannels = enabled
      ? [...new Set([...preferences.channels, channel])]
      : preferences.channels.filter((c) => c !== channel);
    void save({ ...preferences, channels: nextChannels });
  };

  const fireReminders = async () => {
    setReminderInfo(null);
    const response = await fetch('/api/notifications/reminders', { method: 'POST' });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body) {
      setReminderInfo('Could not check reminders.');
      return;
    }
    setReminderInfo(
      `${body.sent > 0 ? `${body.sent} reminder(s) waiting on you. ` : ''}${body.due} due lead(s) checked now.`,
    );
  };

  return (
    <div className="space-y-4">
      <Checkbox
        label="Lesson reminders"
        description="A day-before and a 30-minute heads-up before each booked lesson."
        checked={preferences.lessonReminders}
        onCheckedChange={(checked) => void save({ ...preferences, lessonReminders: checked })}
      />
      <Checkbox
        label="Session recap emails"
        description="Your tutor's AI recap after each lesson."
        checked={preferences.recapEmails}
        onCheckedChange={(checked) => void save({ ...preferences, recapEmails: checked })}
      />
      <Checkbox
        label="Occasional updates"
        description="New subjects, tutor highlights, learning tips."
        checked={preferences.marketing}
        onCheckedChange={(checked) => void save({ ...preferences, marketing: checked })}
      />
      <FieldSet className="space-y-2 border-t border-border pt-4">
        <FieldLegend className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Channels
        </FieldLegend>
        <Checkbox
          label="Email"
          description="Send reminders to your inbox."
          checked={emailChannel}
          onCheckedChange={(checked) => toggleChannel('email', checked)}
        />
        <Checkbox
          label="WhatsApp"
          description="Send reminders to WhatsApp."
          checked={whatsappChannel}
          onCheckedChange={(checked) => toggleChannel('whatsapp', checked)}
        />
      </FieldSet>
      {saved && (
        <Alert>Preferences saved — reminders fire on your booked lessons&apos; lead windows.</Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {reminderInfo && <Alert variant="info">{reminderInfo}</Alert>}
      <div>
        <Button onClick={fireReminders} variant="secondary" size="sm">
          Check reminders now
        </Button>
      </div>
    </div>
  );
}
