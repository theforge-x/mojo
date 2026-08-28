import { Badge, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';

export default function StudentDashboardPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-headline">Welcome back, David</h1>
      <Card>
        <CardHeader>
          <CardTitle>Next lesson</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span>Conversational Spanish with Ifeoma — in 25 min</span>
          <Badge variant="primary">upcoming</Badge>
        </CardContent>
      </Card>
    </main>
  );
}
