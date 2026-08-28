import { Badge, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-headline">Morning rundown</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pending applications</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-display text-3xl font-extrabold text-headline">12</span>
            <Badge variant="tertiary">3 waiting &gt; 48h</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open disputes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-display text-3xl font-extrabold text-headline">4</span>
            <Badge variant="destructive">1 urgent</Badge>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
