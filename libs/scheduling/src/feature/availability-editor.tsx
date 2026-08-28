'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import type { AvailabilityRule, Weekday } from '../domain/availability.types';

const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

export interface AvailabilityEditorProps {
  initialRules: AvailabilityRule[];
  onSave: (rules: AvailabilityRule[]) => Promise<void>;
}

export function AvailabilityEditor({ initialRules, onSave }: AvailabilityEditorProps) {
  const [rules, setRules] = useState(initialRules);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(rules);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly availability</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center gap-3 text-sm">
            <span className="w-10 font-mono text-muted-foreground">{WEEKDAY_LABELS[rule.weekday]}</span>
            <span>
              {formatMinute(rule.startMinute)} – {formatMinute(rule.endMinute)}
            </span>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setRules([...rules])}>
          Add a window
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save availability'}
        </Button>
      </CardContent>
    </Card>
  );
}

function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
