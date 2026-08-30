import { Badge, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { FileDisputeForm } from '../../../components/file-dispute-form';
import { getAdmin } from '../../../demo/composition-root';

export default async function DisputesPage() {
  const disputes = getAdmin().disputes.list();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 font-display text-2xl font-bold text-headline">Disputes</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Filed against sessions, reviewed by trust &amp; safety. Filing here goes through the
        trust-safety use case and lands in the audit log.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>File a dispute</CardTitle>
        </CardHeader>
        <CardContent>
          <FileDisputeForm />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {disputes.map((dispute) => (
          <Card key={dispute.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <div className="text-sm">
                  {dispute.sessionId} · filed by {dispute.filedBy}
                </div>
                <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(dispute.filedAt).toLocaleString()}
                  {dispute.resolvedAt && (
                    <> · resolved {new Date(dispute.resolvedAt).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <Badge
                variant={
                  dispute.status === 'open'
                    ? 'tertiary'
                    : dispute.status === 'upheld'
                      ? 'primary'
                      : 'muted'
                }
              >
                {dispute.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
