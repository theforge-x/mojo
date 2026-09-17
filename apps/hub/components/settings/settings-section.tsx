import { Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import type { ReactNode } from 'react';

export interface SettingsSectionDef {
  readonly id: string;
  readonly label: string;
}

/** Anchored card section — the main-content half of the settings layout. */
export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: ReactNode;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-label={typeof title === 'string' ? title : id} className="scroll-mt-24">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm font-normal text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
